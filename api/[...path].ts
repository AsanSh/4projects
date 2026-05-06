export default async function handler(req, res) {
  const { default: app } = await import('../dist/index.mjs');
  return app(req, res);
}
