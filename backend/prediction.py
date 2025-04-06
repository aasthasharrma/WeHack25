import pandas as pd
import sys

def get_highest_confidence_prediction(csv_file_path, ticker):
    """
    Get the prediction with the highest confidence percentile for a given ticker.
    
    Args:
        csv_file_path (str): Path to the CSV file
        ticker (str): The ticker symbol to analyze
    
    Returns:
        str: Formatted message with the prediction and confidence percentile
    """
    try:
        # Read the CSV file
        df = pd.read_csv(csv_file_path)
        
        # Filter data for the given ticker
        ticker_data = df[df['Ticker'] == ticker]
        
        # Check if ticker exists in the data
        if ticker_data.empty:
            return f"No data found for ticker {ticker}"
        
        # Find the row with the highest confidence percentile
        highest_confidence_row = ticker_data.loc[ticker_data['Confidence_Percentile'].idxmax()]
        
        # Extract prediction and confidence percentile
        prediction = highest_confidence_row['Prediction']
        confidence_percentile = highest_confidence_row['Confidence_Percentile']
        
        # Determine UP or DOWN
        direction = "UP" if prediction > 0 else "DOWN"
        
        # Format the result message
        result = f"The model predicts {ticker} to go {direction} with {confidence_percentile:.2f}% confidence percentile"
        
        return result
    
    except FileNotFoundError:
        return f"Error: The file {csv_file_path} was not found."
    except pd.errors.EmptyDataError:
        return f"Error: The file {csv_file_path} is empty."
    except pd.errors.ParserError:
        return f"Error: The file {csv_file_path} is not a valid CSV file."
    except Exception as e:
        return f"An error occurred: {str(e)}"

def main():
    # Check if correct number of arguments are provided
    if len(sys.argv) != 3:
        print("Usage: python script.py <csv_file_path> <ticker>")
        return
    
    csv_file_path = sys.argv[1]
    ticker = sys.argv[2]
    
    result = get_highest_confidence_prediction(csv_file_path, ticker)
    print(result)

if __name__ == "__main__":
    main()