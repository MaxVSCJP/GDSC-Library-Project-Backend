This is a practise project made s a final project for GDSC 2024 Backend Course.
This is just the backend of the project, the frontend will be made another time.

If you want to clone this project, make sure to install the neccessary modules that can be seen in the package.json file's dependencies attribute.
You also need to add an .env file to the root of the project and add a "JWT_SECRET" attribute in it for the code to function as well as a "MONGODB_URI" attribute along with your own Mongodb Atlas Cluster.

Anbibu is a platform which allows books vendors and libraries to manage their libraries online. In doing so it also allows potential readers or buyers to see all the available books on the platform giving book vendors a place to market their libraries.

Anbibu's architecture is fairly simple.

The MongoDB database consists of 2 collections: 
- Users &
- Books

There are 2 main actors in this platform. Both are users of the platform, but one is libraries & book vendors (whose data is saved by the platform) while the other is readers, which are on the platform to scour through the catalogs of books to find one to read(at a library) or buy(from a vendor). Henceforth, the former type of User shall be refered to as User, while the latter shall be refered to as Readers.

A User is either a book vendor or a library and they can use the platform to manage their library while also marketing it to the masses online.
A User can perform simple CRUD operations on Books (add books, search for books, update books, delete books).

Readers can use the platform to find books that they like contact the vendor if they want to buy it or go to one of the libraries that houses the book they were interested in.

