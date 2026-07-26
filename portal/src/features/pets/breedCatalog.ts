export const DOG_BREEDS = [
  "Affenpinscher","Afghan Hound","Airedale Terrier","Akita","Alaskan Malamute",
  "American Bulldog","American Eskimo Dog","American Foxhound","American Hairless Terrier",
  "American Pit Bull Terrier","American Staffordshire Terrier","Australian Cattle Dog",
  "Australian Shepherd","Basenji","Basset Hound","Beagle","Belgian Malinois",
  "Bernese Mountain Dog","Bichon Frise","Bloodhound","Border Collie","Border Terrier",
  "Boston Terrier","Boxer","Boykin Spaniel","Brittany","Brussels Griffon","Bull Terrier",
  "Bulldog","Bullmastiff","Cairn Terrier","Cane Corso","Cavalier King Charles Spaniel",
  "Chesapeake Bay Retriever","Chihuahua","Chinese Crested","Chinese Shar-Pei","Chow Chow",
  "Cocker Spaniel","Collie","Corgi - Cardigan Welsh","Corgi - Pembroke Welsh",
  "Dachshund","Dalmatian","Doberman Pinscher","English Cocker Spaniel","English Setter",
  "English Springer Spaniel","French Bulldog","German Shepherd Dog","German Shorthaired Pointer",
  "Giant Schnauzer","Golden Retriever","Goldendoodle","Great Dane","Great Pyrenees",
  "Greyhound","Havanese","Irish Setter","Irish Wolfhound","Italian Greyhound",
  "Jack Russell Terrier","Japanese Chin","Labradoodle","Labrador Retriever","Lhasa Apso",
  "Maltese","Mastiff","Miniature Pinscher","Miniature Schnauzer","Mixed Breed",
  "Newfoundland","Norfolk Terrier","Norwegian Elkhound","Old English Sheepdog","Papillon",
  "Pekingese","Pomeranian","Poodle - Miniature","Poodle - Standard","Poodle - Toy",
  "Portuguese Water Dog","Pug","Rat Terrier","Rhodesian Ridgeback","Rottweiler",
  "Saint Bernard","Samoyed","Schnauzer - Standard","Scottish Terrier","Shetland Sheepdog",
  "Shiba Inu","Shih Tzu","Siberian Husky","Soft Coated Wheaten Terrier","Staffordshire Bull Terrier",
  "Standard Poodle","Vizsla","Weimaraner","Welsh Terrier","West Highland White Terrier",
  "Whippet","Wire Fox Terrier","Yorkshire Terrier","Other / Not Listed"
] as const;

export const CAT_BREEDS = [
  "Abyssinian","American Bobtail","American Curl","American Shorthair","American Wirehair",
  "Balinese","Bengal","Birman","Bombay","British Shorthair","Burmese","Chartreux",
  "Cornish Rex","Devon Rex","Domestic Longhair","Domestic Medium Hair","Domestic Shorthair",
  "Egyptian Mau","Exotic Shorthair","Himalayan","Japanese Bobtail","Maine Coon","Manx",
  "Mixed Breed","Norwegian Forest Cat","Ocicat","Oriental","Persian","Ragdoll",
  "Russian Blue","Savannah","Scottish Fold","Siamese","Siberian","Singapura","Somali",
  "Sphynx","Tonkinese","Turkish Angora","Turkish Van","Other / Not Listed"
] as const;

export function breedsForSpecies(species: string): readonly string[] {
  if (species === "Dog") return DOG_BREEDS;
  if (species === "Cat") return CAT_BREEDS;
  return [];
}
