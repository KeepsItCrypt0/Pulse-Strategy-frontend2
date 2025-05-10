export const formatNumber = (value, isRatio = false) => {
  try {
    const num = Number(value);
    if (isNaN(num)) throw new Error("Invalid number");
    if (isRatio) {
      return `${num.toFixed(2)} to 1`;
    }
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 4,
      minimumFractionDigits: 0,
    }).format(num);
  } catch (err) {
    console.error("Format number error:", { value, error: err.message });
    return isRatio ? "1 to 1" : "0";
  }
};

export const formatDate = (timestamp) => {
  if (!timestamp || timestamp === "0") return "Never";
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};
