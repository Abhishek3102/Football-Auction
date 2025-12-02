export const getTeamAssets = (teamName) => {
  const normalizedName = teamName?.toLowerCase().trim();
  
  const assets = {
    "ac milan": {
      logo: "/logos/ac milan.jpeg",
      customGradient: "linear-gradient(135deg, #ED1C24, #000000)",
    },
    "arsenal": {
      logo: "/logos/arsenal.jpeg",
      customGradient: "linear-gradient(135deg, #EF0107, #023474)",
    },
    "fc barcelona": {
      logo: "/logos/barcelona.jpeg",
      customGradient: "linear-gradient(135deg, #A50044, #004D98)",
    },
    "bayern munich": {
      logo: "/logos/bayern munich.jpeg",
      customGradient: "linear-gradient(135deg, #DC052D, #FFCC00)",
    },
    "chelsea": {
      logo: "/logos/chelsea.jpeg",
      customGradient: "linear-gradient(135deg, #034694, #FFFFFF)",
    },
    "liverpool": {
      logo: "/logos/liverpool.jpeg",
      customGradient: "linear-gradient(135deg, #C8102E, #00B2A9)",
    },
    "manchester city": {
      logo: "/logos/manchester city.jpeg",
      customGradient: "linear-gradient(135deg, #6CABDD, #1C2C5B)",
    },
    "manchester united": {
      logo: "/logos/manchester united.jpg",
      customGradient: "linear-gradient(135deg, #DA291C, #FBE122)",
    },
    "psg": {
      logo: "/logos/psg.jpeg",
      customGradient: "linear-gradient(135deg, #004170, #DA291C)",
    },
    "real madrid": {
      logo: "/logos/real madrid.jpeg",
      customGradient: "linear-gradient(135deg, #FEBE10, #00529F)",
    },
  };

  return assets[normalizedName] || {
    logo: "/logos/placeholder-logo.png",
    customGradient: "linear-gradient(135deg, #1a1a1a, #000000)",
  };
};
