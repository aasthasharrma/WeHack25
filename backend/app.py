from flask import Flask, render_template, request, send_file, jsonify
from flask_cors import CORS
import os
from newsPaper import NewsStockTrader
from sentiment import RedditStockTrader
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for server environment
import pandas as pd
from flask import send_from_directory
import json
from datetime import datetime


app = Flask(__name__, template_folder='../frontend/templates', static_folder='../frontend/static')
CORS(app)  # Enable CORS for all routes

# Create a directory for storing analysis data
ANALYSIS_DATA_DIR = 'analysis_data'
os.makedirs(ANALYSIS_DATA_DIR, exist_ok=True)



def get_model_prediction(ticker):
    """
    Get the highest confidence prediction for the given ticker from the model CSV file.
    
    Args:
        ticker (str): Stock ticker symbol
    
    Returns:
        dict: Prediction details or None if no prediction found
    """
    try:
        # Path to the CSV file containing model predictions
        model_csv_path = f"improved_cnn_lstm_predictions.csv"
        
        if not os.path.exists(model_csv_path):
            return None
        
        # Read model predictions CSV
        model_df = pd.read_csv(model_csv_path)
        
        # Filter predictions for the given ticker
        ticker_predictions = model_df[model_df['Ticker'] == ticker]
        
        if ticker_predictions.empty:
            return None
        
        # Get the prediction with the highest confidence percentile
        best_prediction = ticker_predictions.loc[ticker_predictions['Confidence_Percentile'].idxmax()]
        

        # Format the prediction message
        if best_prediction['Prediction'].upper() == "UP":
            direction = "UP"
        elif best_prediction['Prediction'].upper() == "DOWN":
            direction = "DOWN"
        else:
            direction = "FLAT"
        message = f"The model predicts {ticker} to go {direction} with {best_prediction['Confidence_Percentile']}% confidence"
        
        return {
            'message': message,
            'date': best_prediction['Date'],
            'direction': direction,
            'confidence': best_prediction['Confidence'],
            'confidence_percentile': best_prediction['Confidence_Percentile']
        }
    except Exception as e:
        print(f"Error getting model prediction: {e}")
        return None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze():
    stock_ticker = request.form['stock_ticker'].upper()  # Convert to uppercase for consistency
    
    # Create directories for results if they don't exist
    os.makedirs('frontend/static/results', exist_ok=True)
    
    # Run news analysis
    news_analyzer = NewsStockTrader(stock_ticker)
    news_results, news_recommendation = news_analyzer.run_analysis()
    
    # Run Reddit analysis
    reddit_analyzer = RedditStockTrader(stock_ticker)
    reddit_results, reddit_recommendation = reddit_analyzer.run_analysis()
    
    # Get model prediction
    model_prediction = get_model_prediction(stock_ticker)
    
    # Save results to CSV if available
    news_csv_path = None
    if isinstance(news_results, pd.DataFrame) and not news_results.empty:
        news_csv_path = f"frontend/static/results/{stock_ticker}_news_analysis.csv"
        news_results.to_csv(news_csv_path, index=False)
    
    reddit_csv_path = None
    if isinstance(reddit_results, pd.DataFrame) and not reddit_results.empty:
        reddit_csv_path = f"frontend/static/results/{stock_ticker}_reddit_analysis.csv"
        reddit_results.to_csv(reddit_csv_path, index=False)
    
    # Full paths for checking if files exist
    #news_img_full_path = f"static/results/{stock_ticker}_news_analysis.png"
    
    news_img_path = f"results/{stock_ticker}_news_analysis.png"
    reddit_img_path = f"results/{stock_ticker}_analysis.png"
    
    # Check for existence based on full path
    news_img_exists = os.path.exists(f"frontend/static/{news_img_path}")
    reddit_img_exists = os.path.exists(f"frontend/static/{reddit_img_path}")

    #backend/static/results/AAPL_analysis.png
    
    
    # Prepare the results for the template
    news_summary = None
    if not isinstance(news_results, pd.DataFrame) or news_results.empty:
        news_summary = "Insufficient data"
    else:
        # Get news summaries
        news_summary = {
            'recommendation': news_recommendation,
            'sources': news_analyzer.source_summaries
        }
    
    reddit_summary = None
    if not isinstance(reddit_results, pd.DataFrame) or reddit_results.empty:
        reddit_summary = "Insufficient data"
    else:
        # Get Reddit summaries
        reddit_summary = {
            'recommendation': reddit_recommendation,
            'subreddits': reddit_analyzer.subreddit_summaries
        }
    
    # Convert dataframes to HTML tables for display
    news_table = news_results.to_html(classes='table table-striped', index=False) if isinstance(news_results, pd.DataFrame) and not news_results.empty else None
    reddit_table = reddit_results.to_html(classes='table table-striped', index=False) if isinstance(reddit_results, pd.DataFrame) and not reddit_results.empty else None
    
    # For templates, use paths relative to static folder
    return render_template(
        'results.html',
        stock_ticker=stock_ticker,
        news_summary=news_summary,
        reddit_summary=reddit_summary,
        model_prediction=model_prediction,
        news_table=news_table,
        reddit_table=reddit_table,
        news_img_path=news_img_path if news_img_exists else None,
        reddit_img_path=reddit_img_path if reddit_img_exists else None,
        news_csv_path=news_csv_path if news_csv_path else None,
        reddit_csv_path=reddit_csv_path if reddit_csv_path else None
    )
@app.route('/static/results/<path:filename>')
def serve_results_image(filename):
    results_path = os.path.join('../backend/static/results', filename)
    if os.path.exists(results_path):
        return send_from_directory('../backend/static/results', filename)
    else:
        return "File not found", 404
@app.route('/download/<path:filename>')
def download_file(filename):
    # Adjust path to include frontend directory
    full_path = f"frontend/{filename}" if filename.startswith('static/') else filename
    return send_file(full_path, as_attachment=True)

@app.route('/api/analyze', methods=['POST'])
def api_analyze():
    data = request.get_json()
    stock_ticker = data.get('stock_ticker', '').upper()
    
    if not stock_ticker:
        return jsonify({'error': 'Stock ticker is required'}), 400
    
    # Create directories for results if they don't exist
    os.makedirs('frontend/static/results', exist_ok=True)
    
    # Run news analysis
    news_analyzer = NewsStockTrader(stock_ticker)
    news_results, news_recommendation = news_analyzer.run_analysis()
    
    # Run Reddit analysis
    reddit_analyzer = RedditStockTrader(stock_ticker)
    reddit_results, reddit_recommendation = reddit_analyzer.run_analysis()
    
    # Get model prediction
    model_prediction = get_model_prediction(stock_ticker)
    
    # Prepare response data
    response_data = {
        'stock_ticker': stock_ticker,
        'timestamp': datetime.now().isoformat(),
        'news_summary': {
            'recommendation': news_recommendation,
            'sources': news_analyzer.source_summaries
        } if isinstance(news_results, pd.DataFrame) and not news_results.empty else "Insufficient data",
        'reddit_summary': {
            'recommendation': reddit_recommendation,
            'subreddits': reddit_analyzer.subreddit_summaries
        } if isinstance(reddit_results, pd.DataFrame) and not reddit_results.empty else "Insufficient data",
        'model_prediction': model_prediction
    }
    
    # Store analysis data
    analysis_file = os.path.join(ANALYSIS_DATA_DIR, f'{stock_ticker}_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
    with open(analysis_file, 'w') as f:
        json.dump(response_data, f, indent=2)
    
    return jsonify(response_data)

@app.route('/api/analysis/<ticker>', methods=['GET'])
def get_analysis_history(ticker):
    """Get historical analysis data for a ticker"""
    ticker = ticker.upper()
    analyses = []
    
    for filename in os.listdir(ANALYSIS_DATA_DIR):
        if filename.startswith(ticker):
            with open(os.path.join(ANALYSIS_DATA_DIR, filename), 'r') as f:
                analyses.append(json.load(f))
    
    return jsonify(analyses)

if __name__ == '__main__':
    app.run(debug=True)
