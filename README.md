## Node Express Typescript Prisma Boilerplate

🦄 Starter template for your Express Prisma MySQL API

## 🍔 Stack Specs

- Node.js
- Express
- TypeScript
- Prisma
- MySQL

## 🧬 Development

- Install dependencies

```
yarn install
```

- Create a Database in MySQL (or) You can use GUI to create a database

```
mysql> CREATE DATABASE express;
```

- Copy the `.env.sample` file as `.env`

```
cp .env.sample .env
```

- Edit the MySQL Details in the `.env` file

```
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/DBNAME?schema=public"
```

- Push the Prisma Schema into Database

```
npx prisma migrate dev
```

- Run the development server

```
yarn dev
```

## 🚀 Production Build

- Run the production build

```
yarn build
```

- Start the production server

```
yarn start
```

> Your production build is available on `dist` folder

## 🧭 Endpoints

- `POST` - For Creating New User
- `GET` - For Getting All Users
- `GET` - For Getting User By ID
- `PATCH` - For Updating User By ID
- `DELETE` - For Deleting User By ID