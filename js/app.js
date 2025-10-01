const app = new PIXI.Application({
    resizeTo: window,
    transparent: false,
    backgroundAlpha: 0,
    antialias: true
});

document.getElementById('pixi-container').appendChild(app.view);

// Load both background and displacement textures
const bgTexture = PIXI.Texture.from('images/Background.png');
const displacementTexture = PIXI.Texture.from('images/displacement.png');

const bgSprite = new PIXI.Sprite(bgTexture);
bgSprite.width = window.innerWidth;
bgSprite.height = window.innerHeight;

const displacementSprite = new PIXI.Sprite(displacementTexture);
displacementSprite.texture.baseTexture.wrapMode = PIXI.WRAP_MODES.REPEAT;
displacementSprite.scale.set(2);
displacementSprite.position.set(0, 0);

// Create and apply the filter
const displacementFilter = new PIXI.filters.DisplacementFilter(displacementSprite);
app.stage.filters = [displacementFilter];

// Add everything to the stage
app.stage.addChild(bgSprite);
app.stage.addChild(displacementSprite);

// Animate the displacement map to create distortion
app.ticker.add(() => {
    displacementSprite.x += 0.5;
    displacementSprite.y += 0.3;
});
