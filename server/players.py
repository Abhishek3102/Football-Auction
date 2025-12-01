from faker import Faker
import random
import json
import requests

fake = Faker()

# Manually curated list of player names and positions (expand as needed)
PLAYER_DATA = [
    ("Alisson Becker", "Goalkeeper"),
    ("Ederson Santana de Moraes", "Goalkeeper"),
    ("Thibaut Courtois", "Goalkeeper"),
    ("Marc-André ter Stegen", "Goalkeeper"),
    ("Jan Oblak", "Goalkeeper"),
    ("Gianluigi Donnarumma", "Goalkeeper"),
    ("Alphonso Davies", "Defender"),
    ("João Cancelo", "Defender"),
    ("Trent Alexander-Arnold", "Defender"),
    ("Virgil van Dijk", "Defender"),
    ("Rúben Dias", "Defender"),
    ("Marquinhos", "Defender"),
    ("Achraf Hakimi", "Defender"),
    ("Dayot Upamecano", "Defender"),
    ("Andrew Robertson", "Defender"),
    ("Thiago Silva", "Defender"),
    ("Kalidou Koulibaly", "Defender"),
    ("David Alaba", "Defender"),
    ("Antonio Rüdiger", "Defender"),
    ("Jordi Alba", "Defender"),
    ("Casemiro", "Midfielder"),
    ("Kevin De Bruyne", "Midfielder"),
    ("N'Golo Kanté", "Midfielder"),
    ("Joshua Kimmich", "Midfielder"),
    ("Luka Modrić", "Midfielder"),
    ("Toni Kroos", "Midfielder"),
    ("Rodri", "Midfielder"),
    ("Pedri", "Midfielder"),
    ("Lucas Paquetá", "Midfielder"),
    ("Marco Verratti", "Midfielder"),
    ("Bernardo Silva", "Midfielder"),
    ("Frenkie de Jong", "Midfielder"),
    ("Bruno Fernandes", "Midfielder"),
    ("Lionel Messi", "Forward"),
    ("Kylian Mbappé", "Forward"),
    ("Neymar", "Forward"),
    ("Mohamed Salah", "Forward"),
    ("Robert Lewandowski", "Forward"),
    ("Erling Haaland", "Forward"),
    ("Sadio Mané", "Forward"),
    ("Harry Kane", "Forward"),
    ("Vinícius Júnior", "Forward"),
    ("Karim Benzema", "Forward"),
    ("Heung-min Son", "Forward"),
    ("Lautaro Martínez", "Forward"),
    ("Romelu Lukaku", "Forward"),
    ("Paulo Dybala", "Forward"),
    ("Antoine Griezmann", "Forward"),
    ("Gabriel Jesus", "Forward"),
    ("Raheem Sterling", "Forward"),
    ("Phil Foden", "Forward"),
    ("Bukayo Saka", "Forward"),
    ("Martin Ødegaard", "Midfielder"),
    ("Declan Rice", "Midfielder"),
    ("Jack Grealish", "Forward"),
    ("James Maddison", "Midfielder"),
    ("Jamal Musiala", "Midfielder"),
    ("Federico Chiesa", "Forward"),
    ("Rafael Leão", "Forward"),
    ("Victor Osimhen", "Forward"),
    ("Khvicha Kvaratskhelia", "Forward"),
    ("Nicolo Barella", "Midfielder"),
    ("Sandro Tonali", "Midfielder"),
    ("Christian Eriksen", "Midfielder"),
    ("Sergej Milinković-Savić", "Midfielder"),
    ("Youri Tielemans", "Midfielder"),
    ("Julian Alvarez", "Forward"),
    ("Darwin Núñez", "Forward"),
    ("Cody Gakpo", "Forward"),
    ("Marcus Rashford", "Forward"),
    ("Anthony Martial", "Forward"),
    ("Lisandro Martínez", "Defender"),
    ("Raphaël Varane", "Defender"),
    ("Luke Shaw", "Defender"),
    ("Bruno Guimarães", "Midfielder"),
    ("Alexander Isak", "Forward"),
    ("Sven Botman", "Defender"),
    ("Kieran Trippier", "Defender"),
    ("Nick Pope", "Goalkeeper"),
    ("Alphonse Areola", "Goalkeeper"),
    ("Emiliano Martínez", "Goalkeeper"),
    ("Aaron Ramsdale", "Goalkeeper"),
    ("Unai Simón", "Goalkeeper"),
    ("Wojciech Szczęsny", "Goalkeeper"),
    ("Keylor Navas", "Goalkeeper"),
    ("Jordan Pickford", "Goalkeeper"),
    ("Sam Johnstone", "Goalkeeper"),
    ("Dean Henderson", "Goalkeeper"),
    ("Caoimhin Kelleher", "Goalkeeper"),
    ("Alban Lafont", "Goalkeeper"),
    ("Predrag Rajković", "Goalkeeper"),
    ("Koen Casteels", "Goalkeeper"),
    ("David Raya", "Goalkeeper"),
    ("Robert Sánchez", "Goalkeeper"),
    ("Brice Samba", "Goalkeeper"),
    ("Jose Sa", "Goalkeeper"),
    ("Neto", "Goalkeeper"),
    ("Bernd Leno", "Goalkeeper"),
    ("Illan Meslier", "Goalkeeper"),
    ("Guglielmo Vicario", "Goalkeeper"),
    ("Marco Carnesecchi", "Goalkeeper"),
    ("Michele Di Gregorio", "Goalkeeper"),
    ("Alex Meret", "Goalkeeper"),
    ("Rui Patrício", "Goalkeeper"),
    ("Lukasz Skorupski", "Goalkeeper"),
    ("Federico Dimarco", "Defender"),
    ("Alessandro Bastoni", "Defender"),
    ("Stefan de Vrij", "Defender"),
    ("Milan Skriniar", "Defender"),
    ("Giovanni Di Lorenzo", "Defender"),
    ("Theo Hernandez", "Defender"),
    ("Fikayo Tomori", "Defender"),
    ("Pierre Kalulu", "Defender"),
    ("Davide Calabria", "Defender"),
    ("Bremer", "Defender"),
    ("Danilo", "Defender"),
    ("Gleison Bremer", "Defender"),
    ("Leonardo Bonucci", "Defender"),
    ("Manuel Akanji", "Defender"),
    ("Benjamin Pavard", "Defender"),
    ("Lucas Hernandez", "Defender"),
    ("Matthijs de Ligt", "Defender"),
    ("Niklas Süle", "Defender"),
    ("Nico Schlotterbeck", "Defender"),
    ("Andreas Christensen", "Defender"),
    ("Jules Koundé", "Defender"),
    ("Ronald Araújo", "Defender"),
    ("Alejandro Balde", "Defender"),
    ("Eric García", "Defender"),
    ("Álex Moreno", "Defender"),
    ("Iñigo Martínez", "Defender"),
    ("José María Giménez", "Defender"),
    ("Stefan Savić", "Defender"),
    ("Mario Hermoso", "Defender"),
    ("Reinildo Mandava", "Defender"),
    ("Nahuel Molina", "Defender"),
    ("Marcos Acuña", "Defender"),
    ("Nicolás Tagliafico", "Defender"),
    ("Cristian Romero", "Defender"),
    ("Nicolás Otamendi", "Defender"),
    ("Davinson Sánchez", "Defender"),
    ("Piero Hincapié", "Defender"),
    ("Edmond Tapsoba", "Defender"),
    ("Evan Ndicka", "Defender"),
    ("Maxence Lacroix", "Defender"),
    ("Ibrahima Konaté", "Defender"),
    ("Joël Matip", "Defender"),
    ("Joe Gomez", "Defender"),
    ("Ben White", "Defender"),
    ("William Saliba", "Defender"),
    ("Gabriel Magalhães", "Defender"),
    ("Oleksandr Zinchenko", "Defender"),
    ("Kyle Walker", "Defender"),
    ("John Stones", "Defender"),
    ("Aymeric Laporte", "Defender"),
    ("Nathan Aké", "Defender"),
    ("Tyrone Mings", "Defender"),
    ("Kurt Zouma", "Defender"),
    ("Craig Dawson", "Defender"),
    ("James Ward-Prowse", "Midfielder"),
    ("Jordan Henderson", "Midfielder"),
    ("Thomas Partey", "Midfielder"),
    ("Martin Ødegaard", "Midfielder"),
    ("Alexis Mac Allister", "Midfielder"),
    ("Eberechi Eze", "Midfielder"),
    ("Oliver Skipp", "Midfielder"),
    ("Enzo Fernandez", "Midfielder"),
    ("Christopher Nkunku", "Forward"),
    ("Kai Havertz", "Forward"),
    ("Mykhailo Mudryk", "Forward"),
    ("Noni Madueke", "Forward"),
    ("Christian Pulisic", "Forward"),
    ("Arnaut Danjuma", "Forward"),
    ("João Félix", "Forward"),
    ("Álvaro Morata", "Forward"),
    ("Antoine Griezmann", "Forward"),
    ("Memphis Depay", "Forward"),
    ("Ansu Fati", "Forward"),
    ("Raphinha", "Forward"),
    ("Ousmane Dembélé", "Forward"),
    ("Ferran Torres", "Forward"),
    ("Dusan Vlahovic", "Forward"),
    ("Ciro Immobile", "Forward"),
    ("Gerard Moreno", "Forward"),
    ("Iago Aspas", "Forward"),
    ("Borja Iglesias", "Forward"),
    ("Joselu", "Forward"),
    ("Callum Wilson", "Forward"),
    ("Ivan Toney", "Forward"),
    ("Ollie Watkins", "Forward"),
    ("Danny Ings", "Forward"),
    ("Dominic Calvert-Lewin", "Forward"),
    ("Brennan Johnson", "Forward"),
    ("Luis Díaz", "Forward"),
    ("Diogo Jota", "Forward"),
    ("Eddie Nketiah", "Forward"),
    ("Anthony Martial", "Forward"),
    ("Wout Weghorst", "Forward"),
    ("Hugo Ekitike", "Forward"),
    ("Randal Kolo Muani", "Forward"),
    ("Jonathan David", "Forward"),
    ("Donyell Malen", "Forward"),
    ("Brian Brobbey", "Forward"),
    ("Xavi Simons", "Forward"),
    ("Myron Boadu", "Forward"),
    ("Kasper Dolberg", "Forward"),
    ("Gonçalo Ramos", "Forward"),
    ("André Silva", "Forward"),
    ("Gonçalo Guedes", "Forward"),
    ("Ricardo Horta", "Forward"),
    ("Vitinha", "Midfielder"),
    ("Otávio", "Midfielder"),
    ("João Palhinha", "Midfielder"),
    ("Renato Sanches", "Midfielder"),
    ("William Carvalho", "Midfielder"),
    ("Matheus Nunes", "Midfielder"),
    ("Florentino Luís", "Midfielder"),
    ("João Mário", "Midfielder"),
    ("Pizzi", "Midfielder"),
    ("Rafa Silva", "Forward"),
]

def get_duckduckgo_image_url(query):
    """Uses DuckDuckGo to get a relevant image URL."""
    try:
        url = "https://api.duckduckgo.com/"
        params = {
            "q": query,
            "iax": "images",
            "ia": "images",
            "t": "h_", #My own tracking parameter
            "format": "json"
        }
        response = requests.get(url, params=params)
        response.raise_for_status()  # Raise HTTPError for bad responses (4xx or 5xx)
        data = response.json()
        if data and data['RelatedTopics']:
            for topic in data['RelatedTopics']:
                if 'FirstURL' in topic and topic['FirstURL']:
                    return topic['FirstURL'] #Return the first image
        return None  # No image found
    except requests.exceptions.RequestException as e:
        print(f"Error fetching image for {query}: {e}")
        return None


def generate_player(name, position, existing_names):
    """Generates a single player object with realistic attributes."""

    rating = random.randint(65, 99)  # Adjust range for desired quality distribution
    base_price = round(random.uniform(3.0, 15.0), 1)  # Adjust range as needed (in millions)

    # Ensure price scales somewhat with rating
    base_price += (rating - 65) * 0.1

    # Cap the price
    base_price = min(base_price, 25.0)  # Maximum price

    base_price = round(base_price, 1)

    image_url = get_duckduckgo_image_url(f"{name} football player")

    player = {
        "name": name,
        "position": position,
        "rating": rating,
        "basePrice": base_price,
        "imageUrl": image_url
    }
    return player

def create_football_players(num_players=300):
    """Generates a list of unique football player objects."""
    players = []
    used_names = set()  # Keep track of used names

    #Prioritize using data from PLAYER_DATA first
    for name, position in PLAYER_DATA:
      if len(players) < num_players and name not in used_names:
        player = generate_player(name, position, used_names)
        players.append(player)
        used_names.add(name)


    #Fill in remaining players with Faker and some degree of position balancing
    positions = ["Goalkeeper", "Defender", "Midfielder", "Forward"]
    position_counts = {pos: 0 for pos in positions}
    for player in players:
        position_counts[player["position"]] += 1


    while len(players) < num_players:
        position = random.choice(positions)
        #Attempt to balance positions slightly - this isn't perfect.
        if all(count >= num_players // 4 for count in position_counts.values()): #if all positions have a decent amount, randomize more freely
            position = random.choice(positions)
        else:
             position = min(position_counts, key=position_counts.get) #choose the least frequent position

        name = fake.name()
        if name not in used_names: #Avoid duplicates
            player = generate_player(name, position, used_names)
            players.append(player)
            used_names.add(name)
            position_counts[position] += 1



    return players

# Generate the players
football_players = create_football_players(num_players=300)

# Output to JSON
with open("football_players.json", "w") as f:
    json.dump(football_players, f, indent=2)

print(f"Generated {len(football_players)} football players in football_players.json")