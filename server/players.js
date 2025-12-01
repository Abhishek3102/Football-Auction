// utils/seedPlayers.js

const fs = require("fs");
const { faker } = require("@faker-js/faker");

// Position requirements
const positionDistribution = {
  Goalkeeper: 35,
  Defender: 90,
  Midfielder: 90,
  Forward: 85,
};

const generatePlayer = (position) => {
  const name = faker.person.fullName();
  const rating = faker.number.int({ min: 60, max: 90 });
  // Base price in crores, loosely tied to rating
  const basePrice = parseFloat(
    (rating * faker.number.float({ min: 0.1, max: 0.2 })).toFixed(1)
  );

  return {
    name,
    position,
    rating,
    basePrice,
  };
};

const allPlayers = [];

for (const [position, count] of Object.entries(positionDistribution)) {
  for (let i = 0; i < count; i++) {
    allPlayers.push(generatePlayer(position));
  }
}

// Shuffle to randomize list
allPlayers.sort(() => Math.random() - 0.5);

// Write to a file (optional)
fs.writeFileSync("players.json", JSON.stringify(allPlayers, null, 2), "utf-8");

console.log(`✅ Generated ${allPlayers.length} players.`);
