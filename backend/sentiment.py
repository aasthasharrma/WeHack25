import praw
import pandas as pd
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
import os
class RedditStockTrader:
    def __init__(self, stock_ticker):
        # Reddit API credentials
        self.client_id = '5_F9LLP27v6oeA9Bp9Eolg'
        self.client_secret = 'ju7U0I44aC0vU-LMdkFOrQRhbi45Gw'
        self.user_agent = 'new'
        
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
        print(f"Analyzing r/{subreddit_name} for {self.stock_ticker}...")
        
        subreddit = self.reddit.subreddit(subreddit_name)
        posts = subreddit.search(self.stock_ticker, sort='new', time_filter=time_filter, limit=limit)
        
        results = []
        buy_count = 0
        sell_count = 0
        hold_count = 0
        total_sentiment = 0
        post_count = 0
        
        # Iterate through fetched posts and analyze sentiment
        for post in posts:
            post_count += 1
            title_sentiment = self.analyze_sentiment(post.title)
            body_sentiment = self.analyze_sentiment(post.selftext)
            
            # Average sentiment of title and body (with more weight on title)
            avg_sentiment = (title_sentiment * 1.5 + body_sentiment) / 2.5 if post.selftext else title_sentiment
            total_sentiment += avg_sentiment
            
            decision = self.make_trading_decision(avg_sentiment)
            
            if decision == 'BUY':
                buy_count += 1
            elif decision == 'SELL':
                sell_count += 1
            else:
                hold_count += 1
                
            results.append({
                'Subreddit': subreddit_name,
                'Title': post.title,
                'Created': datetime.fromtimestamp(post.created_utc).strftime('%Y-%m-%d %H:%M'),
                'Upvotes': post.score,
                'Comments': post.num_comments,
                'Sentiment': round(avg_sentiment, 3),
                'Decision': decision
            })
        
        # Store summary for this subreddit
        if post_count > 0:
            avg_subreddit_sentiment = total_sentiment / post_count
            overall_decision = self.make_trading_decision(avg_subreddit_sentiment)
            
            self.subreddit_summaries[subreddit_name] = {
                'Posts': post_count,
                'Buy': buy_count,
                'Sell': sell_count,
                'Hold': hold_count,
                'Avg_Sentiment': round(avg_subreddit_sentiment, 3),
                'Decision': overall_decision
            }
            
            # Add results to all_results
            self.all_results.extend(results)
            
            return results
        else:
            print(f"No posts found for {self.stock_ticker} in r/{subreddit_name}")
            return []

    def run_analysis(self):
        """Run analysis across all subreddits"""
        try:
            total_buy = 0
            total_sell = 0
            total_hold = 0
            total_posts = 0
            
            # Analyze each subreddit
            for subreddit in self.subreddits:
                try:
                    self.analyze_subreddit(subreddit)
                except Exception as e:
                    print(f"Error analyzing subreddit {subreddit}: {str(e)}")
                    continue
            
            # Create DataFrame from all results
            if self.all_results:
                results_df = pd.DataFrame(self.all_results)
                
                # Calculate totals
                for subreddit, summary in self.subreddit_summaries.items():
                    total_buy += summary['Buy']
                    total_sell += summary['Sell'] 
                    total_hold += summary['Hold']
                    total_posts += summary['Posts']
                
                # Calculate overall sentiment
                overall_sentiment = sum(s['Avg_Sentiment'] * s['Posts'] for s in self.subreddit_summaries.values()) / total_posts if total_posts > 0 else 0
                
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
                print(f"Total posts analyzed: {total_posts}")
                print("\nSubreddit Breakdown:")
                for subreddit, summary in self.subreddit_summaries.items():
                    print(f"  r/{subreddit}: {summary['Posts']} posts, Sentiment: {summary['Avg_Sentiment']}, Decision: {summary['Decision']}")
                
                print(f"\nOverall Sentiment: {round(overall_sentiment, 3)}")
                print(f"Buy signals: {total_buy}")
                print(f"Sell signals: {total_sell}")
                print(f"Hold signals: {total_hold}")
                print(f"\nOVERALL RECOMMENDATION: {final_decision}")
                
                # Optional: Create visualization
                try:
                    self.create_visualization(total_buy, total_sell, total_hold)
                except Exception as e:
                    print(f"Error creating visualization: {str(e)}")
                
                return results_df, final_decision
            else:
                print(f"No data found for {self.stock_ticker} across any subreddits")
                return pd.DataFrame(), 'INSUFFICIENT DATA'
        except Exception as e:
            print(f"Error in run_analysis: {str(e)}")
            return pd.DataFrame(), f"Error analyzing Reddit data: {str(e)}"
    
    def create_visualization(self, total_buy, total_sell, total_hold):
        """Create visualization of sentiment across subreddits"""
        if not self.subreddit_summaries:
            return
            
        # Prepare data for plotting
        subreddits = list(self.subreddit_summaries.keys())
        sentiments = [summary['Avg_Sentiment'] for summary in self.subreddit_summaries.values()]
        post_counts = [summary['Posts'] for summary in self.subreddit_summaries.values()]
        
        # Create figure with two subplots
        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 6))
        
        # Plot average sentiment by subreddit
        colors = ['green' if s > 0 else 'red' for s in sentiments]
        ax1.bar(subreddits, sentiments, color=colors)
        ax1.set_title(f'Sentiment Analysis for {self.stock_ticker}')
        ax1.set_xlabel('Subreddit')
        ax1.set_ylabel('Average Sentiment')
        plt.setp(ax1.xaxis.get_majorticklabels(), rotation=45)
        
        # Plot signal distribution - fixed the pie chart error
        if total_buy + total_sell + total_hold > 0:  # Ensure we have data
            signal_counts = [total_buy, total_sell, total_hold]
            labels = ['Buy', 'Sell', 'Hold']
            colors = ['green', 'red', 'gray']
            
            ax2.pie(signal_counts, labels=labels, colors=colors, autopct='%1.1f%%')
            ax2.set_title('Trading Signal Distribution')
        
        plt.tight_layout()
        plt.savefig(os.path.join('/Users/purva/Desktop/test/static/results', f"{self.stock_ticker}_analysis.png"))

        
        plt.show()

# Main execution
if __name__ == "__main__":
    stock_ticker = input('What stock do you want to analyze (e.g., AAPL, TSLA): ')
    analyzer = RedditStockTrader(stock_ticker)
    results, recommendation = analyzer.run_analysis()
    
    # Save results to CSV if available
    if not results.empty:
        results.to_csv(f"{stock_ticker}_reddit_analysis.csv", index=False)
        print(f"\nResults saved to {stock_ticker}_reddit_analysis.csv")