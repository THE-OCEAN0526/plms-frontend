// 告訴 TypeScript 所有的 .png 檔案都是一個模組，且預設匯出是一個字串路徑
declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}