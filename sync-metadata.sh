rm -rf frontend/src/contracts/squidchat
rm -rf frontend/src/contracts/types/squidchat

mkdir -p frontend/src/contracts/squidchat && cp contract/target/ink/squidchat.* frontend/src/contracts/squidchat

cd frontend
npx dedot typink -m src/contracts/squidchat/squidchat.json -o src/contracts/types

echo "Synced metadata 🔥"
