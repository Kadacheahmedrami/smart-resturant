import os
import csv
import requests
from io import StringIO
import time
from urllib.parse import quote
import random
from bs4 import BeautifulSoup

def download_image(query, filename, folder="images"):
    """
    Download an image from the web based on a search query and save it with the given filename
    """
    # Create the folder if it doesn't exist
    if not os.path.exists(folder):
        os.makedirs(folder)
        print(f"Created folder: {folder}")
    
    # Check if the file already exists
    filepath = os.path.join(folder, filename)
    if os.path.exists(filepath):
        print(f"File {filename} already exists. Skipping download.")
        return False
    
    # Format search query
    search_query = quote(f"{query} food dish restaurant")
    
    # Set up headers to mimic a browser
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }
    
    try:
        # Get search results page
        search_url = f"https://www.bing.com/images/search?q={search_query}&form=HDRSC2"
        response = requests.get(search_url, headers=headers)
        response.raise_for_status()
        
        # Parse the HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Find image URLs (this selector might need adjustment based on the actual structure)
        img_tags = soup.select('.mimg')
        
        if not img_tags:
            print(f"No images found for {query}")
            return False
        
        # Choose a random image from the first few results
        max_index = min(5, len(img_tags))
        img_tag = random.choice(img_tags[:max_index])
        img_url = img_tag['src']
        
        # If the URL is a data URI, try to get the next image
        if img_url.startswith('data:'):
            for i in range(min(10, len(img_tags))):
                if not img_tags[i]['src'].startswith('data:'):
                    img_url = img_tags[i]['src']
                    break
            else:
                # Check for data-src attribute
                for img in img_tags[:10]:
                    if img.get('data-src') and not img['data-src'].startswith('data:'):
                        img_url = img['data-src']
                        break
                else:
                    print(f"Could not find valid image URL for {query}")
                    return False
        
        # Download the image
        img_response = requests.get(img_url, headers=headers)
        img_response.raise_for_status()
        
        # Save the image
        with open(filepath, 'wb') as f:
            f.write(img_response.content)
        
        print(f"Downloaded image for {query} as {filename}")
        return True
    
    except Exception as e:
        print(f"Error downloading image for {query}: {e}")
        return False

def parse_csv_data(csv_data):
    """Parse CSV data from a string"""
    csv_reader = csv.DictReader(StringIO(csv_data))
    return list(csv_reader)

def clean_csv_row(row):
    """Clean up a row from CSV data by stripping whitespace from keys and values"""
    return {k.strip(): v.strip() if isinstance(v, str) else v for k, v in row.items()}

def main():
    # Sample CSV data
    csv_data = """id,name,description,price,image,category
1,Classic Burger,"House-made beef patty with lettuce, tomato, and special sauce",12.99,classic_burger.jpg,Burgers
2,Veggie Burger,"Plant-based patty with avocado, sprouts, and vegan aioli",13.99,veggie_burger.jpg,Burgers
3,Chicken Sandwich,"Grilled chicken breast with bacon, swiss cheese, and honey mustard",11.99,chicken_sandwich.jpg,Sandwiches
4,Fish Tacos,"Beer-battered cod, cabbage slaw, and lime crema in corn tortillas",14.99,fish_tacos.jpg,Specialties
5,Caesar Salad,"Romaine lettuce, parmesan cheese, croutons, and classic dressing",9.99,caesar_salad.jpg,Salads
6,French Fries,"Hand-cut potatoes, fried crispy and seasoned with sea salt",4.99,french_fries.jpg,Sides
7,Chocolate Milkshake,"House-made chocolate ice cream blended with milk and topped with whipped cream",6.99,chocolate_milkshake.jpg,Drinks
8,Margherita Pizza,"Fresh mozzarella, tomato sauce, and basil on thin crust",15.99,margherita_pizza.jpg,Pizza
9,Buffalo Wings,"Crispy wings tossed in spicy buffalo sauce with blue cheese dip",12.99,buffalo_wings.jpg,Appetizers
10,Cheesecake,"New York style with graham cracker crust and berry compote",7.99,cheesecake.jpg,Desserts
11,Iced Tea,"House-brewed black tea with lemon and optional simple syrup",2.99,iced_tea.jpg,Drinks
12,Steak Frites,"8oz ribeye with truffle fries and herb butter",24.99,steak_frites.jpg,Entrees
13,Mac & Cheese,"Three-cheese blend with toasted breadcrumb topping",10.99,mac_cheese.jpg,Sides
14,Onion Rings,"Beer-battered sweet onions with spicy ketchup",5.99,onion_rings.jpg,Sides
15,Mushroom Risotto,"Arborio rice with wild mushrooms, white wine, and parmesan",16.99,mushroom_risotto.jpg,Entrees"""

    # Parse the CSV data
    menu_items = parse_csv_data(csv_data)
    
    # Clean up each row
    menu_items = [clean_csv_row(row) for row in menu_items]
    
    print(f"Found {len(menu_items)} menu items in the CSV data.")
    
    # Download images for each menu item
    successful_downloads = 0
    for item in menu_items:
        # Get image filename from CSV
        image_filename = item['image']
        
        # Download the image
        search_query = f"{item['name']} {item['category']}"
        if download_image(search_query, image_filename):
            successful_downloads += 1
        
        # Add a small delay to avoid overwhelming the server
        time.sleep(1.5)
    
    print(f"Downloaded {successful_downloads} out of {len(menu_items)} images.")
    print(f"Images have been saved to the 'images' folder.")

if __name__ == "__main__":
    main()