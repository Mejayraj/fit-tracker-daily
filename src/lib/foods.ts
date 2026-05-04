// Per 100g
export type FoodItem = {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

export const FOOD_DB: FoodItem[] = [
  { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fat: 3.6 },
  { name: "Salmon", calories: 208, protein: 20, carbs: 0, fat: 13 },
  { name: "Egg (whole)", calories: 155, protein: 13, carbs: 1.1, fat: 11 },
  { name: "Greek Yogurt (plain)", calories: 59, protein: 10, carbs: 3.6, fat: 0.4 },
  { name: "Cottage Cheese", calories: 98, protein: 11, carbs: 3.4, fat: 4.3 },
  { name: "Tofu", calories: 76, protein: 8, carbs: 1.9, fat: 4.8 },
  { name: "Brown Rice (cooked)", calories: 112, protein: 2.6, carbs: 23, fat: 0.9 },
  { name: "White Rice (cooked)", calories: 130, protein: 2.7, carbs: 28, fat: 0.3 },
  { name: "Pasta (cooked)", calories: 131, protein: 5, carbs: 25, fat: 1.1 },
  { name: "Oats (dry)", calories: 389, protein: 17, carbs: 66, fat: 7 },
  { name: "Bread (whole wheat)", calories: 247, protein: 13, carbs: 41, fat: 3.4 },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fat: 0.3 },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fat: 0.2 },
  { name: "Blueberries", calories: 57, protein: 0.7, carbs: 14, fat: 0.3 },
  { name: "Avocado", calories: 160, protein: 2, carbs: 9, fat: 15 },
  { name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
  { name: "Spinach", calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 },
  { name: "Sweet Potato", calories: 86, protein: 1.6, carbs: 20, fat: 0.1 },
  { name: "Potato", calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fat: 50 },
  { name: "Peanut Butter", calories: 588, protein: 25, carbs: 20, fat: 50 },
  { name: "Olive Oil", calories: 884, protein: 0, carbs: 0, fat: 100 },
  { name: "Milk (2%)", calories: 50, protein: 3.3, carbs: 4.8, fat: 2 },
  { name: "Cheddar Cheese", calories: 402, protein: 25, carbs: 1.3, fat: 33 },
  { name: "Beef (lean)", calories: 250, protein: 26, carbs: 0, fat: 15 },
  { name: "Tuna (canned)", calories: 132, protein: 28, carbs: 0, fat: 1 },
  { name: "Quinoa (cooked)", calories: 120, protein: 4.4, carbs: 21, fat: 1.9 },
  { name: "Lentils (cooked)", calories: 116, protein: 9, carbs: 20, fat: 0.4 },
  { name: "Black Beans", calories: 132, protein: 8.9, carbs: 24, fat: 0.5 },
  { name: "Chocolate (dark 70%)", calories: 598, protein: 7.8, carbs: 46, fat: 43 },
  { name: "Pizza (cheese)", calories: 266, protein: 11, carbs: 33, fat: 10 },
  { name: "Burger (beef)", calories: 295, protein: 17, carbs: 24, fat: 14 },
  { name: "French Fries", calories: 312, protein: 3.4, carbs: 41, fat: 15 },
  { name: "Coffee (black)", calories: 1, protein: 0.1, carbs: 0, fat: 0 },
  { name: "Orange Juice", calories: 45, protein: 0.7, carbs: 10, fat: 0.2 },
  { name: "Soda (cola)", calories: 42, protein: 0, carbs: 11, fat: 0 },
  { name: "Beer", calories: 43, protein: 0.5, carbs: 3.6, fat: 0 },
  { name: "Wine (red)", calories: 85, protein: 0.1, carbs: 2.6, fat: 0 },
];

export function searchFoods(q: string): FoodItem[] {
  const s = q.trim().toLowerCase();
  if (!s) return FOOD_DB.slice(0, 10);
  return FOOD_DB.filter((f) => f.name.toLowerCase().includes(s)).slice(0, 20);
}

export function scaleFood(food: FoodItem, grams: number) {
  const factor = grams / 100;
  return {
    calories: Math.round(food.calories * factor),
    protein: +(food.protein * factor).toFixed(1),
    carbs: +(food.carbs * factor).toFixed(1),
    fat: +(food.fat * factor).toFixed(1),
  };
}