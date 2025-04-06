import requests
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import os
class NewsStockTrader:
    def __init__(self, stock_ticker):
        # NewsAPI credentials
        self.api_key = os.getenv('NEWS_API_KEY')  # Get your key from https://newsapi.org/
        
        # Stock ticker to analyze
        self.stock_ticker = stock_ticker
        
        # List of financial news sources
        self.sources = [
            'bloomberg', 'abc-news', 'wired', 'bbc-news', 'reuters', 'cnbc', 'the-wall-street-journal', 'marketwatch', 'Yahoo Finance', 'Business Insider'
        ]
        
        # Initialize sentiment analyzer
        self.analyzer = SentimentIntensityAnalyzer()
        
        # Store results
        self.all_results = []
        self.source_summaries = {}

    def get_date_range(self):
        """Get today's date and date from 3 days ago for filtering"""
        today = datetime.now()
        three_days_prior = today - timedelta(days=10)
        return today.strftime('%Y-%m-%d'), three_days_prior.strftime('%Y-%m-%d')

    def analyze_sentiment(self, text):
        """Analyze sentiment of text using VADER"""
        if not text:
            return 0
        sentiment = self.analyzer.polarity_scores(text)
        return sentiment['compound']  # Using compound score as overall sentiment

    def make_trading_decision(self, sentiment_score):
        """Make trading decision based on sentiment score"""
        if sentiment_score >= 0.2:
            return 'BUY'
        elif sentiment_score <= -0.1:
            return 'SELL'
        else:
            return 'HOLD'

    def fetch_articles(self, source, date_from, date_to):
        """Fetch articles related to the stock ticker from NewsAPI"""
        
        url = f'https://newsapi.org/v2/everything?q={self.stock_ticker}&sources={source}&from={date_from}&to={date_to}&apiKey={self.api_key}'
        response = requests.get(url)
        return response.json()

    def analyze_source(self, source_name, date_from, date_to):
        """Analyze articles from a specific news source"""
        print(f"Analyzing {source_name} for {self.stock_ticker}...")
        
        articles_data = self.fetch_articles(source_name, date_from, date_to)
        articles = articles_data.get('articles', [])
        
        results = []
        buy_count = 0
        sell_count = 0
        hold_count = 0
        total_sentiment = 0
        article_count = 0
        
        # Iterate through fetched articles and analyze sentiment
        for article in articles:
            article_count += 1
            title_sentiment = self.analyze_sentiment(article['title'])
            description_sentiment = self.analyze_sentiment(article['description'])
            
            # Average sentiment of title and description (with more weight on title)
            avg_sentiment = (title_sentiment * 1.5 + description_sentiment) / 2.5 if article.get('description') else title_sentiment
            total_sentiment += avg_sentiment
            
            decision = self.make_trading_decision(avg_sentiment)
            
            if decision == 'BUY':
                buy_count += 1
            elif decision == 'SELL':
                sell_count += 1
            else:
                hold_count += 1
                
            results.append({
                'Source': source_name,
                'Title': article['title'],
                'Published': article['publishedAt'],
                'Description': article['description'],
                'Sentiment': round(avg_sentiment, 3),
                'Decision': decision
            })
        
        # Store summary for this source
        if article_count > 0:
            avg_source_sentiment = total_sentiment / article_count
            overall_decision = self.make_trading_decision(avg_source_sentiment)
            
            self.source_summaries[source_name] = {
                'Articles': article_count,
                'Buy': buy_count,
                'Sell': sell_count,
                'Hold': hold_count,
                'Avg_Sentiment': round(avg_source_sentiment, 3),
                'Decision': overall_decision
            }
            
            # Add results to all_results
            self.all_results.extend(results)
            
            return results
        else:
            print(f"No articles found for {self.stock_ticker} in {source_name}")
            return []

    def run_analysis(self):
        """Run analysis across all news sources"""
        total_buy = 0
        total_sell = 0
        total_hold = 0
        total_articles = 0
        
        # Get date range for analysis (past 3 days)
        date_today, date_three_days_ago = self.get_date_range()
        print(date_three_days_ago)
        
        # Analyze each news source
        for source in self.sources:
            self.analyze_source(source, date_three_days_ago, date_today)
        
        # Create DataFrame from all results
        if self.all_results:
            results_df = pd.DataFrame(self.all_results)
            
            # Calculate totals
            for source, summary in self.source_summaries.items():
                total_buy += summary['Buy']
                total_sell += summary['Sell'] 
                total_hold += summary['Hold']
                total_articles += summary['Articles']
            
            # Calculate overall sentiment
            overall_sentiment = sum(s['Avg_Sentiment'] * s['Articles'] for s in self.source_summaries.values()) / total_articles if total_articles > 0 else 0
            
            # Make final decision
            if total_buy > total_sell:
                final_decision = 'BUY'
            elif total_sell > total_buy:
                final_decision = 'SELL'
            else:
                final_decision = 'HOLD'
            
            # Print results
            print("\n====== RESULTS SUMMARY ======")
            print(f"Stock: {self.stock_ticker}")
            print(f"Total articles analyzed: {total_articles}")
            print("\nSource Breakdown:")
            for source, summary in self.source_summaries.items():
                print(f"  {source}: {summary['Articles']} articles, Sentiment: {summary['Avg_Sentiment']}, Decision: {summary['Decision']}")
            
            print(f"\nOverall Sentiment: {round(overall_sentiment, 3)}")
            print(f"Buy signals: {total_buy}")
            print(f"Sell signals: {total_sell}")
            print(f"Hold signals: {total_hold}")
            print(f"\nOVERALL RECOMMENDATION: {final_decision}")
            
            # Optional: Create visualization
            self.create_visualization(total_buy, total_sell, total_hold)
            
            return results_df, final_decision
        else:
            print(f"No data found for {self.stock_ticker} across any news sources")
            return pd.DataFrame(), 'INSUFFICIENT DATA'
    
    def create_visualization(self, total_buy, total_sell, total_hold):
        """Create visualization of sentiment across news sources"""
        if not self.source_summaries:
            return
            
        # Prepare data for plotting
        sources = list(self.source_summaries.keys())
        sentiments = [summary['Avg_Sentiment'] for summary in self.source_summaries.values()]
        article_counts = [summary['Articles'] for summary in self.source_summaries.values()]
        
        # Create figure with two subplots
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
        
        # Plot average sentiment by source
        colors = ['green' if s > 0 else 'red' for s in sentiments]
        ax1.bar(sources, sentiments, color=colors)
        ax1.set_title(f'Sentiment Analysis for {self.stock_ticker}')
        ax1.set_xlabel('Source')
        ax1.set_ylabel('Average Sentiment')
        plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45)
        
        # Plot signal distribution
        if total_buy + total_sell + total_hold > 0:  # Ensure we have data
            signal_counts = [total_buy, total_sell, total_hold]
            labels = ['Buy', 'Sell', 'Hold']
            colors = ['green', 'red', 'gray']
            
            ax2.pie(signal_counts, labels=labels, colors=colors, autopct='%1.1f%%')
            ax2.set_title('Trading Signal Distribution')
        
        plt.tight_layout()
        plt.savefig(os.path.join('/Users/purva/Desktop/test/static/results', f"{self.stock_ticker}_news_analysis.png"))
        plt.show()

# Main execution
if __name__ == "__main__":
    

    stock_ticker = input('What stock do you want to analyze (e.g., AAPL, TSLA): ')
    analyzer = NewsStockTrader(stock_ticker)
    results, recommendation = analyzer.run_analysis()
    
    # Save results to CSV if available
    if not results.empty:
        results.to_csv(f"{stock_ticker}_news_analysis.csv", index=False)
        print(f"\nResults saved to {stock_ticker}_news_analysis.csv")
