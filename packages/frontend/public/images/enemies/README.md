Drop enemy portrait images here. Recommended filenames:

- `goblin.png` or `goblin.webp`

You can optimize/resize the original image with the repository script:

```bash
# install sharp if needed (in repo root or use the backend workspace where sharp is already installed)
# npm --workspace rpg-gemini-backend install sharp

# Run the optimizer (example):
node ../../scripts/optimize-enemy-portraits.mjs /path/to/your/goblin-source.png --out ./
```

After placing `goblin.png` here the UI will automatically use `/images/enemies/goblin.png` as the default goblin portrait.
