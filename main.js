const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true);
const scene = new BABYLON.Scene(engine);

// Camera (First-Person)
const camera = new BABYLON.UniversalCamera("camera", new BABYLON.Vector3(0, 7, 0), scene);
camera.attachControl(canvas, true);
camera.inertia = 0;
camera.angularSensibility = 1000;

// Pointer Lock
canvas.addEventListener('click', () => canvas.requestPointerLock());

// Lighting
const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

// Infinite Ground
// const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 1000, height: 1000 }, scene);
// const groundMat = new BABYLON.StandardMaterial("groundMat", scene);
// const groundTex = new BABYLON.Texture("assets/textures/grass.jpg", scene);
// groundTex.uScale = 50;  // Repeat grass texture
// groundTex.vScale = 50;
// groundMat.diffuseTexture = groundTex;
// ground.material = groundMat;

const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 1000, height: 1000 }, scene);
const groundMat = new BABYLON.PBRMaterial("groundMat", scene);

groundMat.albedoTexture = new BABYLON.Texture("assets/textures/color.jpg", scene);  // Color
groundMat.bumpTexture = new BABYLON.Texture("assets/textures/Normal.jpg", scene);  // Normal Map
groundMat.ambientTexture = new BABYLON.Texture("assets/textures/AO.jpg", scene);  // AO Map
groundMat.metallicTexture = new BABYLON.Texture("assets/textures/Roughness.jpg", scene);  // Roughness Map
groundMat.useRoughnessFromMetallicTextureAlpha = false;
groundMat.useRoughnessFromMetallicTextureGreen = true;

groundMat.displacementTexture = new BABYLON.Texture("assets/textures/Displacement.jpg", scene);  // Height Map
groundMat.useParallax = true;
groundMat.useParallaxOcclusion = true;
groundMat.parallaxScaleBias = 0.1;  // Adjust for subtle height

groundMat.albedoTexture.uScale = 100;
groundMat.albedoTexture.vScale = 100;
groundMat.bumpTexture.uScale = 100;
groundMat.bumpTexture.vScale = 100;
groundMat.ambientTexture.uScale = 100;
groundMat.ambientTexture.vScale = 100;
groundMat.metallicTexture.uScale = 100;
groundMat.metallicTexture.vScale = 100;
groundMat.displacementTexture.uScale = 100;
groundMat.displacementTexture.vScale = 100;

ground.material = groundMat;


const environmentTexture = new BABYLON.HDRCubeTexture("assets/environment/sky1.hdr", scene, 512);
scene.environmentTexture = environmentTexture;

// Skybox (optional, depends if you want a physical skybox mesh)
const skybox = scene.createDefaultSkybox(environmentTexture, true, 1000);



//Skybox
// const skybox = BABYLON.MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
// const skyboxMaterial = new BABYLON.StandardMaterial("skyBoxMaterial", scene);
// skyboxMaterial.backFaceCulling = false;
// skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture("assets/textures/skybox/", scene);
// skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
// skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);   // No diffuse tint
// skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);  // No specular shine
// skybox.material = skyboxMaterial;

// Scaling function
function scaleMesh(mesh, factor) {
    mesh.scaling = new BABYLON.Vector3(factor, factor, factor);
}

// NPC Data
const npcs = [
    {
        name: "Guide Bot",
        position: new BABYLON.Vector3(3, 0, 3),
        model: "npc1.glb",
        dialogue: [
            "Welcome to our world!",
            "Could you please talk to the Explorer nearby?"
        ],
        quest: { description: "Find and talk to Explorer", completed: false, target: "Explorer" }
    },
    {
        name: "Explorer",
        position: new BABYLON.Vector3(-5, 0, 6),
        model: "npc1.glb",
        dialogue: ["Thanks for finding me!", "Have you seen the tree nearby?"],
        quest: null
    }
];

// Current Quests
let currentQuests = [];
function updateQuestLog() {
    const log = document.getElementById('questLog');
    log.innerHTML = currentQuests.map(q => `${q.description} - ${q.completed ? '✅' : '❌'}`).join('<br>');
}

// Load NPCs
npcs.forEach(npc => {
    BABYLON.SceneLoader.ImportMesh("", "assets/characters/", npc.model, scene, (meshes) => {
        npc.mesh = meshes[0];
        npc.mesh.position = npc.position;
        scaleMesh(npc.mesh,4);

        scene.onBeforeRenderObservable.add(() => {
            if (camera.position.subtract(npc.mesh.position).length() < 3) {
                showDialogue(npc);
            }
        });
    });
});

// Show Dialogue
function showDialogue(npc) {
    const box = document.getElementById('dialogueBox');
    box.innerText = npc.dialogue.join("\n");
    box.style.display = 'block';

    window.addEventListener('keydown', (e) => {
        if (e.key.toLowerCase() === 'y') {
            startQuest(npc);
            box.style.display = 'none';
        } else if (e.key.toLowerCase() === 'n') {
            box.style.display = 'none';
        }
    }, {once: true});
}

// Start Quest
function startQuest(npc) {
    if (npc.quest && !npc.quest.completed) {
        currentQuests.push({...npc.quest});
        updateQuestLog();
    }
}

// Check Quest Completion
function checkQuestCompletion(npcName) {
    currentQuests.forEach(q => {
        if (q.target === npcName) {
            q.completed = true;
        }
    });
    updateQuestLog();
}

// Trees and Buildings
function loadEnvironment() {
    BABYLON.SceneLoader.ImportMesh("", "assets/environment/", "tree.glb", scene, (meshes) => {
        const treeMesh = meshes[0];  // Get the main tree mesh
        treeMesh.position = new BABYLON.Vector3(0, 0, 0);
        treeMesh.scaling = new BABYLON.Vector3(0.7, 0.7, 0.7);

        // Clone and randomly place trees across the map
        for (let i = 0; i < 40; i++) {   // 0 trees - you can increase this
            const newTree = treeMesh.clone("treeClone" + i);
            
            // Random position (adjust range based on your campus size)
            newTree.position = new BABYLON.Vector3(
                Math.random() * 500 - 250,  // X range from -250 to 250
                0,
                Math.random() * 500 - 250   // Z range from -250 to 250
            );
        }
    });

    BABYLON.SceneLoader.ImportMesh("", "assets/environment/", "building.glb", scene, (meshes) => {
        meshes[0].position = new BABYLON.Vector3(0, 0, 2500);
    });
}
loadEnvironment();

// Movement - Relative to Camera Direction (FPS-like)
let inputMap = {};
scene.actionManager = new BABYLON.ActionManager(scene);
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyDownTrigger, (evt) => {
    inputMap[evt.sourceEvent.key.toLowerCase()] = true;
}));
scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, (evt) => {
    inputMap[evt.sourceEvent.key.toLowerCase()] = false;
}));

scene.onBeforeRenderObservable.add(() => {
    let forward = camera.getDirection(BABYLON.Vector3.Forward());
    let right = camera.getDirection(BABYLON.Vector3.Right());

    let movement = BABYLON.Vector3.Zero();
    if (inputMap['w']) movement.addInPlace(forward);
    if (inputMap['s']) movement.subtractInPlace(forward);
    if (inputMap['a']) movement.subtractInPlace(right);
    if (inputMap['d']) movement.addInPlace(right);

    movement.y = 0;  // Stay on ground
    let speed = 0.5;
    if (inputMap['shift']) speed = 1;  // Sprint when holding Shift
    movement.normalize().scaleInPlace(speed);
    camera.position.addInPlace(movement);
});

// Render Loop
engine.runRenderLoop(() => scene.render());
window.addEventListener('resize', () => engine.resize());
