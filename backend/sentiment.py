import praw
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import os

class RedditStockTrader:
    def __init__(self, stock_ticker):
        # Reddit API credentials
        
        self.client_id = os.getenv('CLIENT_ID', 'JRSdzEF-EwY3lial42o0ig')
        
        self.client_secret = os.getenv('CLIENT_SECRET', 'AQLZ6zdXvLD5rPs_0xMiB6vlhytuqQ')
        self.user_agent = os.getenv('USER_AGENT', 'test')
        
        # Initialize Reddit instance
        self.reddit = praw.Reddit(
            client_id=self.client_id,
            client_secret=self.client_secret,
            user_agent=self.user_agent
        )
        
        # Stock ticker to analyze
        self.stock_ticker = stock_ticker
        
        # List of stock-related subreddits to analyze
        self.subreddits = [
            'wallstreetbets',
            'stocks',
            'investing',
            'stockmarket',
            'options'
        ]
        
        # Initialize sentiment analyzer
        self.analyzer = SentimentIntensityAnalyzer()
        
        # Store results
        self.all_results = []
        self.subreddit_summaries = {}

    def get_date_range(self):
        """Get today's date and date from 3 days ago for filtering"""
        today = datetime.now()
        three_days_prior = today - timedelta(days=3)
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

    def analyze_subreddit(self, subreddit_name, time_filter='week', limit=100):
        """Analyze posts from a specific subreddit"""
        try:
            subreddit = self.reddit.subreddit(subreddit_name)
            posts = subreddit.search(f"{self.stock_ticker}", time_filter=time_filter, limit=limit)
            
            results = []
            total_sentiment = 0
            post_count = 0
            
            for post in posts:
                # Skip posts that don't contain the ticker in the title
                if self.stock_ticker.lower() not in post.title.lower():
                    continue
                
                # Analyze title sentiment
                title_sentiment = self.analyze_sentiment(post.title)
                
                # Analyze comment sentiment
                comment_sentiment = 0
                comment_count = 0
                
                post.comments.replace_more(limit=0)  # Flatten comment tree
                for comment in post.comments.list():
                    comment_sentiment += self.analyze_sentiment(comment.body)
                    comment_count += 1
                
                # Calculate average comment sentiment
                avg_comment_sentiment = comment_sentiment / comment_count if comment_count > 0 else 0
                
                # Calculate overall post sentiment (weighted average)
                post_sentiment = (title_sentiment * 0.7) + (avg_comment_sentiment * 0.3)
                
                # Make trading decision
                decision = self.make_trading_decision(post_sentiment)
                
                # Store results
                results.append({
                    'subreddit': subreddit_name,
                    'title': post.title,
                    'url': post.url,
                    'score': post.score,
                    'title_sentiment': title_sentiment,
                    'comment_sentiment': avg_comment_sentiment,
                    'overall_sentiment': post_sentiment,
                    'decision': decision,
                    'created_utc': datetime.fromtimestamp(post.created_utc).strftime('%Y-%m-%d %H:%M:%S')
                })
                
                total_sentiment += post_sentiment
                post_count += 1
            
            # Calculate average sentiment for the subreddit
            avg_sentiment = total_sentiment / post_count if post_count > 0 else 0
            
            # Make overall decision for the subreddit
            decision = self.make_trading_decision(avg_sentiment)
            
            # Count decisions
            buy_count = sum(1 for r in results if r['decision'] == 'BUY')
            sell_count = sum(1 for r in results if r['decision'] == 'SELL')
            hold_count = sum(1 for r in results if r['decision'] == 'HOLD')
            
            # Store subreddit summary
            self.subreddit_summaries[subreddit_name] = {
                'Decision': decision,
                'Avg_Sentiment': round(avg_sentiment, 3),
                'Posts': post_count,
                'Buy': buy_count,
                'Sell': sell_count,
                'Hold': hold_count
            }
            
            return pd.DataFrame(results)
        except Exception as e:
            print(f"Error analyzing subreddit {subreddit_name}: {e}")
            return pd.DataFrame()

    def run_analysis(self):
        """Run analysis on all subreddits"""
        all_results = []
        
        for subreddit in self.subreddits:
            results = self.analyze_subreddit(subreddit)
            if not results.empty:
                all_results.append(results)
        
        if not all_results:
            return pd.DataFrame(), "Insufficient data"
        
        # Combine all results
        combined_results = pd.concat(all_results, ignore_index=True)
        
        # Calculate overall sentiment
        overall_sentiment = combined_results['overall_sentiment'].mean()
        
        # Make overall decision
        overall_decision = self.make_trading_decision(overall_sentiment)
        
        # Count overall decisions
        total_buy = sum(1 for r in combined_results['decision'] if r == 'BUY')
        total_sell = sum(1 for r in combined_results['decision'] if r == 'SELL')
        total_hold = sum(1 for r in combined_results['decision'] if r == 'HOLD')
        
        # Create visualization
        self.create_visualization(total_buy, total_sell, total_hold)
        
        # Format the recommendation output
        formatted_recommendation = f"Recommendation: {overall_decision}\nSubreddit Breakdown:"
        
        for subreddit, summary in self.subreddit_summaries.items():
            formatted_recommendation += f"\nr/{subreddit}: {summary['Posts']} posts, Sentiment: {summary['Avg_Sentiment']:.3f}, Decision: {summary['Decision']}"
        
        return combined_results, formatted_recommendation

    def create_visualization(self, total_buy, total_sell, total_hold):
        """Create visualization of sentiment analysis results"""
        try:
            # Create directory for results if it doesn't exist
            os.makedirs('frontend/static/results', exist_ok=True)
            
            # Create pie chart
            plt.figure(figsize=(10, 6))
            plt.pie([total_buy, total_sell, total_hold], 
                   labels=['BUY', 'SELL', 'HOLD'],
                   colors=['green', 'red', 'gray'],
                   autopct='%1.1f%%',
                   startangle=90)
            plt.title(f'Sentiment Analysis for {self.stock_ticker}')
            
            # Save the figure
            plt.savefig(f'frontend/static/results/{self.stock_ticker}_analysis.png')
            plt.close()
        except Exception as e:
            print(f"Error creating visualization: {e}")


# Main execution
if __name__ == "__main__":
    stock_ticker = input('What stock do you want to analyze (e.g., AAPL, TSLA): ')
    analyzer = RedditStockTrader(stock_ticker)
    results, recommendation = analyzer.run_analysis()
    
    # Save results to CSV if available
    if not results.empty:
        results.to_csv(f"{stock_ticker}_reddit_analysis.csv", index=False)
        print(f"\nResults saved to {stock_ticker}_reddit_analysis.csv")

