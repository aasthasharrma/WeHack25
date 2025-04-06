from flask import Flask, render_template, request, send_file
import os
from newsPaper import NewsStockTrader
from sentiment import RedditStockTrader
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend for server environment
import pandas as pd

app = Flask(__name__, 
            template_folder='../frontend/templates',
            static_folder='../frontend/static')

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
    news_img_full_path = f"frontend/static/results/{stock_ticker}_news_analysis.png"
    reddit_img_full_path = f"frontend/static/results/{stock_ticker}_analysis.png"
    
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
        news_table=news_table,
        reddit_table=reddit_table,
        news_img_path=f"results/{stock_ticker}_news_analysis.png" if os.path.exists(news_img_full_path) else None,
        reddit_img_path=f"results/{stock_ticker}_analysis.png" if os.path.exists(reddit_img_full_path) else None,
        news_csv_path=f"results/{stock_ticker}_news_analysis.csv" if news_csv_path else None,
        reddit_csv_path=f"results/{stock_ticker}_reddit_analysis.csv" if reddit_csv_path else None
    )

@app.route('/download/<path:filename>')
def download_file(filename):
    # Adjust path to include frontend directory
    full_path = f"frontend/{filename}" if filename.startswith('static/') else filename
    return send_file(full_path, as_attachment=True)

if __name__ == '__main__':
    app.run(debug=True)