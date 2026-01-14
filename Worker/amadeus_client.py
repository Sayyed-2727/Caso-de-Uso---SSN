from amadeus import Client, ResponseError
import os
from dotenv import load_dotenv

load_dotenv()

class AmadeusService:
    def __init__(self):
        client_id = os.getenv('AMADEUS_API_KEY')
        client_secret = os.getenv('AMADEUS_API_SECRET')
        
        if not client_id or not client_secret:
            print("WARNING: Credenciales de Amadeus no encontradas en variables de entorno.")
        
        self.amadeus = Client(
            client_id=client_id,
            client_secret=client_secret
        )

    def search_flights(self, origin, destination, date):
        try:
            response = self.amadeus.shopping.flight_offers_search.get(
                originLocationCode=origin,
                destinationLocationCode=destination,
                departureDate=date,
                adults=1,
                max=5
            )
            return response.data
        except ResponseError as error:
            print(f"Error llamando a Amadeus: {error}")
            return []

    def get_price(self, origin, destination, date):
        """
        Busca vuelos y devuelve el precio más bajo encontrado como float.
        Retorna None si no encuentra nada o hay error.
        """
        print(f"Consultando Amadeus para: {origin}-{destination} en {date}...")
        offers = self.search_flights(origin, destination, date)
        
        if not offers:
            print("No se encontraron ofertas.")
            return None
        
        min_price = float('inf')
        found = False
        
        for offer in offers:
            try:
                price = float(offer['price']['total'])
                if price < min_price:
                    min_price = price
                    found = True
            except (KeyError, ValueError, TypeError):
                continue
                
        if found:
            return min_price
        return None
