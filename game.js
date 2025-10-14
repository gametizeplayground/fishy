class FishingGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.startScreen = document.getElementById('startScreen');
        this.moneyDisplay = document.getElementById('money');
        this.fishCountDisplay = document.getElementById('fishCount');
        
        // Game state
        this.gameStarted = false;
        this.money = 0;
        this.fishCount = 0;
        this.maxFishPerDrop = 4; // Maximum fish that can be caught in one drop
        
        // Upgrade system
        this.upgrades = {
            bucketSize: { level: 0, baseCost: 100, growthRate: 1.3 }
        };
        this.showUpgrades = false;
        
        // Penguin
        this.penguin = {
            x: 50, /*moved to the right*/
            y: 10, /*moved up*/
            width: 140,
            height: 140
        };
        this.penguinImg = null;
        this.hookImg = null;
        this.bucketImg = null;
        this.containerImg = null;
        this.starImg = null;
        
        // Offsets to control hook anchor and rod tip positions
        this.hookOffsetX = 140; // horizontal offset from penguin.x
        this.hookOffsetY = 120; // vertical offset from penguin.y
        this.rodTipOffsetX = 135; // where the line visually attaches on the rod
        this.rodTipOffsetY = 16;
        
        // First-drop behavior
        this.firstDrop = true;        // the very first drop after starting
        this.disableCatch = false;    // when true, collisions are ignored
        
		// Hook
        this.hook = {
			x: this.penguin.x + this.hookOffsetX,
			y: this.penguin.y + this.hookOffsetY,
			targetY: this.penguin.y + this.hookOffsetY,
			maxDepth: 300,
			dropSpeed: 42, // 3x faster drop
			retractSpeed: 4, // slightly faster ascent
			isDropping: false,
			isRetracting: false,
            caughtFish: []
		};
        
        // Fish
        this.fish = [];
        this.fishSprites = [];
        // Fish assets, values, and rarity (sum of rarity = 1)
        this.fishData = [
            { sprite: 'fish_pink.png', value: 5, rarity: 0.29 },          // common
            { sprite: 'fish_orange.png', value: 10, rarity: 0.24 },       // common
            { sprite: 'fish_blue.png', value: 10, rarity: 0.19 },         // common
            { sprite: 'fish_green.png', value: 15, rarity: 0.12 },        // uncommon
            { sprite: 'fish_red.png', value: 20, rarity: 0.08 },          // uncommon/rare
            { sprite: 'fish_blue_skeleton.png', value: 25, rarity: 0.03 },// rare
            { sprite: 'fish_brown.png', value: 50, rarity: 0.02 },        // very rare
            { sprite: 'diamond.png', value: 100, rarity: 0.01 }           // extremely rare
        ];
        
        // Water level
        this.waterLevel = this.canvas.height * 0.35;
        
        // Position penguin to ride on the water surface (like on a boat)
        this.penguinBaseY = this.waterLevel - this.penguin.height - -20; // base floating height (moved up)
        this.penguin.y = this.penguinBaseY;
        this.bobTime = 0; // for floating animation
        // Realign hook start point with penguin position
        this.hook.x = this.penguin.x + this.hookOffsetX;
        this.hook.y = this.penguin.y + this.hookOffsetY;
        this.hook.targetY = this.hook.y;
        
        // World/depth settings (1m = 6px, 500m drop)
        this.metersToPixels = (m) => m * 6;
        this.maxDepthPx = this.metersToPixels(500); // 500m below water
        
        // Apply bucket size upgrade
        this.maxFishPerDrop = 4 + this.upgrades.bucketSize.level;
        
        // Camera
        this.cameraY = 0; // vertical camera offset
        
        // UI popups (e.g., +$ earned)
        this.popups = [];
        
        // Simple physics state
        this.ticks = 0;
        this.prevHookX = this.hook.x;
        
        // Clouds for background animation
        this.clouds = [];
        this.initClouds();
        
        // Underwater floating light elements
        this.underwaterLights = [];
        this.initUnderwaterLights();
        
        // Star system
        this.stars = [];
        this.starSpawnCount = 0;
        this.maxStarsPerDrop = 3;
        this.showStarPopup = false;
        this.currentStarQuestion = null;
        this.gamePaused = false;
        this.starResult = null;
        this.turnCount = 0; // Track number of turns
        
        // Gametize facts for star questions
        this.gametizeFacts = [
            {
                question: "What is Gametize?",
                options: ["A game development platform", "A fishing game", "A social media app", "A cooking website"],
                correct: 0,
                fact: "Gametize is a platform that helps businesses create engaging games and gamified experiences to boost user engagement and loyalty."
            },
            {
                question: "When was Gametize founded?",
                options: ["2010", "2012", "2015", "2018"],
                correct: 1,
                fact: "Gametize was founded in 2012 and has been helping businesses gamify their experiences for over a decade."
            },
            {
                question: "What does Gametize specialize in?",
                options: ["Video game development", "Gamification solutions", "Mobile app design", "Web development"],
                correct: 1,
                fact: "Gametize specializes in gamification solutions, helping businesses create engaging, game-like experiences for their customers and employees."
            },
            {
                question: "Which industry does Gametize serve?",
                options: ["Only gaming industry", "Multiple industries", "Only tech companies", "Only retail"],
                correct: 1,
                fact: "Gametize serves multiple industries including retail, healthcare, education, finance, and more with their gamification solutions."
            },
            {
                question: "What is the main benefit of Gametize's platform?",
                options: ["Making games", "Increasing user engagement", "Selling products", "Creating websites"],
                correct: 1,
                fact: "The main benefit of Gametize's platform is increasing user engagement and loyalty through gamified experiences and interactive challenges."
            }
        ];
        
        this.init();
    }
    
    initClouds() {
        // Create some clouds for background animation
        for (let i = 0; i < 6; i++) {
            this.clouds.push({
                x: Math.random() * this.canvas.width * 2 - this.canvas.width,
                y: 20 + Math.random() * (this.waterLevel - 80),
                size: 30 + Math.random() * 40,
                speed: 0.2 + Math.random() * 0.4,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
    }

    initUnderwaterLights() {
        // Create floating light elements underwater
        for (let i = 0; i < 12; i++) {
            this.underwaterLights.push({
                x: Math.random() * this.canvas.width,
                y: this.waterLevel + Math.random() * (this.maxDepthPx + 200),
                size: 15 + Math.random() * 25,
                speed: (Math.random() - 0.5) * 0.8, // -0.4 to 0.4
                opacity: 0.2 + Math.random() * 0.3,
                type: Math.random() < 0.6 ? 'pill' : 'circle', // 60% pills, 40% circles
                drift: Math.random() * Math.PI * 2, // random starting drift angle
                driftSpeed: 0.01 + Math.random() * 0.02
            });
        }
    }
    
    init() {
        this.loadSprites();
        this.setupEventListeners();
        this.spawnFish();
        this.gameLoop();
    }
    
    loadSprites() {
        // Load penguin sprite
        const pImg = new Image();
        pImg.onload = () => {
            this.penguinImg = pImg;
        };
        pImg.src = 'assets/penguin.png';

        // Load hook sprite
        const hImg = new Image();
        hImg.onload = () => {
            this.hookImg = hImg;
        };
        hImg.src = 'assets/hook.png';

        // Load bucket sprite
        const bImg = new Image();
        bImg.onload = () => {
            this.bucketImg = bImg;
        };
        bImg.src = 'assets/bucket.png';

        // Load container sprite
        const cImg = new Image();
        cImg.onload = () => {
            this.containerImg = cImg;
        };
        cImg.src = 'assets/container.png';

        // Load star sprite
        const sImg = new Image();
        sImg.onload = () => {
            this.starImg = sImg;
        };
        sImg.src = 'assets/star.png';

        this.fishData.forEach((fishInfo, index) => {
            const img = new Image();
            img.onload = () => {
                this.fishSprites[index] = img;
            };
            img.src = `assets/${fishInfo.sprite}`;
        });
    }
    
    setupEventListeners() {
        const handleInput = (e) => {
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            
            const rect = this.canvas.getBoundingClientRect();
            const x = (e.clientX || e.touches[0].clientX) - rect.left;
            const y = (e.clientY || e.touches[0].clientY) - rect.top;
            
            // Handle star popup clicks
            if (this.showStarPopup && this.currentStarQuestion) {
                const popupWidth = 300;
                const popupHeight = 200;
                const popupX = (this.canvas.width - popupWidth) / 2;
                const popupY = (this.canvas.height - popupHeight) / 2;
                
                // Check if click is within popup area
                if (x >= popupX && x <= popupX + popupWidth && 
                    y >= popupY && y <= popupY + popupHeight) {
                    
                    // Check which option was clicked
                    this.currentStarQuestion.options.forEach((option, index) => {
                        const optionY = popupY + 80 + (index * 30);
                        const optionX = popupX + 20;
                        const optionWidth = popupWidth - 40;
                        const optionHeight = 25;
                        
                        if (x >= optionX && x <= optionX + optionWidth &&
                            y >= optionY - 15 && y <= optionY + 10) {
                            this.answerStarQuestion(index);
                        }
                    });
                }
                return;
            }
            
            // Check upgrade button (below TAP TO PLAY)
            const buttonX = (this.canvas.width - 120) / 2;
            const buttonY = this.canvas.height / 2 + 60;
            const buttonWidth = 120;
            const buttonHeight = 80;
            
            if (x >= buttonX && x <= buttonX + buttonWidth && 
                y >= buttonY && y <= buttonY + buttonHeight) {
                // Directly buy upgrade when clicking the button
                this.buyUpgrade('bucketSize');
                return;
            }
            
            if (!this.gameStarted) {
                this.startGame(true); // start and immediately drop the hook
            } else {
                this.dropHook();
            }
        };

        // Canvas interactions
        this.canvas.addEventListener('click', handleInput, { passive: false });
        this.canvas.addEventListener('touchstart', handleInput, { passive: false });

        // Start overlay interactions (so taps on overlay work)
        this.startScreen.addEventListener('click', handleInput, { passive: false });
        this.startScreen.addEventListener('touchstart', handleInput, { passive: false });

        // Keyboard left/right during ascent
        this.input = { left: false, right: false };
        window.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.input.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.input.right = true;
        });
        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.input.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.input.right = false;
        });

        // Touch/mouse navigation for hook during ascent
        this.touchStartX = 0;
        this.touchCurrentX = 0;
        this.isTouching = false;
        
        // Hover effect for upgrade button
        this.mouseX = 0;
        this.mouseY = 0;
        this.isHoveringUpgrade = false;
        
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.hook.isRetracting) {
                this.isTouching = true;
                this.touchStartX = e.clientX;
                this.touchCurrentX = e.clientX;
            }
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            // Update mouse position for hover effects
            const rect = this.canvas.getBoundingClientRect();
            this.mouseX = e.clientX - rect.left;
            this.mouseY = e.clientY - rect.top;
            
            // Check if hovering over upgrade button
            const buttonX = (this.canvas.width - 120) / 2;
            const buttonY = this.canvas.height / 2 + 60;
            const buttonWidth = 120;
            const buttonHeight = 80;
            
            this.isHoveringUpgrade = (this.mouseX >= buttonX && this.mouseX <= buttonX + buttonWidth && 
                                    this.mouseY >= buttonY && this.mouseY <= buttonY + buttonHeight);
            
            if (this.isTouching && this.hook.isRetracting) {
                this.touchCurrentX = e.clientX;
                this.updateHookFromTouch();
            }
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.isTouching = false;
        });
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.hook.isRetracting && e.touches.length === 1) {
                e.preventDefault();
                this.isTouching = true;
                this.touchStartX = e.touches[0].clientX;
                this.touchCurrentX = e.touches[0].clientX;
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isTouching && this.hook.isRetracting && e.touches.length === 1) {
                e.preventDefault();
                this.touchCurrentX = e.touches[0].clientX;
                this.updateHookFromTouch();
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            this.isTouching = false;
        });

        // Touch zones: hold left/right half of canvas to steer during ascent
        const setTouchDir = (e, down) => {
            if (!e.touches || e.touches.length === 0) { this.input.left = this.input.right = false; return; }
            const rect = this.canvas.getBoundingClientRect();
            const x = e.touches[0].clientX - rect.left;
            this.input.left = down && x < this.canvas.width / 2;
            this.input.right = down && x >= this.canvas.width / 2;
        };
        this.canvas.addEventListener('touchstart', (e) => setTouchDir(e, true), { passive: false });
        this.canvas.addEventListener('touchmove', (e) => setTouchDir(e, true), { passive: false });
        this.canvas.addEventListener('touchend', () => { this.input.left = this.input.right = false; }, { passive: false });
    }
    
    startGame(dropImmediately = false) {
        this.gameStarted = true;
        this.startScreen.classList.add('hidden');
        if (dropImmediately) {
            this.dropHook();
        }
    }
    
    dropHook() {
        if (!this.hook.isDropping && !this.hook.isRetracting) {
            // Hide "TAP TO PLAY" when starting to drop
            this.startScreen.classList.add('hidden');
            
            // Start from penguin's rod base every time
            this.hook.x = this.penguin.x + this.hookOffsetX;
            this.hook.y = this.penguin.y + this.hookOffsetY;
            this.hook.targetY = this.hook.y;
            this.hook.caughtFish = [];
            this.disableCatch = true; // Disable catching on every drop until hook reaches bottom
            this.hook.isDropping = true;
            // drop to 500m below water
            this.hook.targetY = this.waterLevel + this.maxDepthPx;
            
            // Increment turn count and reset star spawn count for this drop
            this.turnCount++;
            this.starSpawnCount = 0;
        }
    }
    
    spawnFish() {
        // Seed initial fish across the full depth
        for (let i = 0; i < 20; i++) {
            this.spawnSingleFish();
        }

        setInterval(() => {
            if (this.gameStarted) {
                // Dynamic spawning based on hook activity
                let spawnCount = 2 + Math.floor(Math.random() * 3); // base 2-4 fish
                
                // More fish when hook is active (dropping or retracting)
                if (this.hook.isDropping || this.hook.isRetracting) {
                    spawnCount += 4 + Math.floor(Math.random() * 5); // extra 4-8 fish
                }
                
                // Ensure minimum fish count in water
                if (this.fish.length < 20) {
                    spawnCount += 3;
                }
                
                for (let n = 0; n < spawnCount; n++) {
                    this.spawnSingleFish();
                }
                
                // Spawn stars every round when hook is dropping
                if (this.hook.isDropping) {
                    this.spawnStar();
                }
            }
        }, 600); // Faster spawning interval
    }

    spawnSingleFish() {
        // Select fish type based on rarity
        const random = Math.random();
        let cumulativeRarity = 0;
        let selectedFishType = 0;
        
        for (let i = 0; i < this.fishData.length; i++) {
            cumulativeRarity += this.fishData[i].rarity;
            if (random <= cumulativeRarity) {
                selectedFishType = i;
                break;
            }
        }
        
        const fishInfo = this.fishData[selectedFishType];
        const w = 40 + Math.random() * 25; // Slightly smaller, more varied sizes
        const h = 25 + Math.random() * 15;
        
        // Determine spawn side and direction
        const spawnFromLeft = Math.random() < 0.5;
        const spawnX = spawnFromLeft ? -50 : this.canvas.width + 50; // Start further off screen
        const spawnY = this.waterLevel + 20 + Math.random() * (this.maxDepthPx - 40);
        
        // Speed varies by fish type (rarer fish swim faster)
        const baseSpeed = 0.5 + Math.random() * 1.0;
        const speed = spawnFromLeft ? baseSpeed : -baseSpeed;
        
        const fish = {
            x: spawnX,
            y: spawnY,
            width: w,
            height: (selectedFishType === 6 ? w : h), // brown fish 1:1 ratio
            speed: speed,
            type: selectedFishType,
            value: fishInfo.value,
            direction: spawnFromLeft ? 1 : -1,
            spawnTime: this.ticks // Track when fish was spawned
        };
        
        this.fish.push(fish);
    }

    spawnStar() {
        // Only spawn star if we haven't reached the limit for this drop
        if (this.starSpawnCount < this.maxStarsPerDrop && this.hook.isDropping) {
            const spawnFromLeft = Math.random() < 0.5;
            const spawnX = spawnFromLeft ? -30 : this.canvas.width + 30;
            // Spawn in mid to top water levels (first 60% of water depth, not bottom 40%)
            const maxSpawnDepth = this.maxDepthPx * 0.6; // Only use first 60% of depth
            const spawnY = this.waterLevel + 20 + Math.random() * maxSpawnDepth;
            
            const star = {
                x: spawnX,
                y: spawnY,
                width: 25,
                height: 25,
                speed: spawnFromLeft ? 0.8 : -0.8,
                direction: spawnFromLeft ? 1 : -1,
                isStar: true,
                value: 0, // Stars don't give money, they give questions
                spawnTime: this.ticks
            };
            
            this.stars.push(star);
            this.starSpawnCount++;
        }
    }
    
    update() {
        if (!this.gamePaused) {
            this.updateHook();
            this.updateFish();
            this.updateStars();
            this.checkCollisions();
            this.updateCamera();
            this.updatePopups();
            this.updatePenguinFloat();
            this.updateClouds();
            this.updateUnderwaterLights();
        }
        this.ticks++;
    }

    updatePenguinFloat() {
        // Gentle bobbing animation to simulate floating
        this.bobTime += 0.02;
        const amplitude = 3; // pixels up/down
        this.penguin.y = this.penguinBaseY + Math.sin(this.bobTime) * amplitude;
        
        // Hook bobs with the penguin when not actively fishing
        if (!this.hook.isDropping && !this.hook.isRetracting) {
            this.hook.y = this.penguin.y + this.hookOffsetY;
        }
    }

    updateClouds() {
        this.clouds.forEach(cloud => {
            cloud.x += cloud.speed;
            // Reset cloud position when it goes off screen
            if (cloud.x > this.canvas.width + cloud.size) {
                cloud.x = -cloud.size;
                cloud.y = 20 + Math.random() * (this.waterLevel - 80);
            }
        });
    }

    updateUnderwaterLights() {
        this.underwaterLights.forEach(light => {
            // Horizontal floating movement
            light.x += light.speed;
            light.drift += light.driftSpeed;
            
            // Add subtle vertical drift
            light.y += Math.sin(light.drift) * 0.3;
            
            // Wrap around horizontally
            if (light.x < -light.size) {
                light.x = this.canvas.width + light.size;
            } else if (light.x > this.canvas.width + light.size) {
                light.x = -light.size;
            }
            
            // Keep within water bounds
            if (light.y < this.waterLevel) {
                light.y = this.waterLevel + Math.random() * 50;
            }
        });
    }

    updateHookFromTouch() {
        if (!this.hook.isRetracting) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = this.touchCurrentX - rect.left;
        const canvasWidth = this.canvas.width;
        
        // Calculate target position based on touch/mouse position
        const targetX = (canvasX / canvasWidth) * canvasWidth;
        
        // Much smoother and faster movement using interpolation
        const horizontalSpeed = 8; // Increased from 4 to 8
        const smoothing = 0.15; // Smooth interpolation factor
        
        // Smooth interpolation towards target position
        const diff = targetX - this.hook.x;
        this.hook.x += diff * smoothing;
        
        // Add direct movement for immediate response
        if (Math.abs(diff) > 5) {
            const directMove = Math.sign(diff) * Math.min(horizontalSpeed, Math.abs(diff) * 0.3);
            this.hook.x += directMove;
        }
        
        // Keep hook within canvas bounds
        this.hook.x = Math.max(20, Math.min(canvasWidth - 20, this.hook.x));
    }
    
    updateHook() {
        if (this.hook.isDropping) {
            this.hook.y += this.hook.dropSpeed;
            if (this.hook.y >= this.hook.targetY) {
                this.hook.isDropping = false;
                this.hook.isRetracting = true;
                // Enable catching only when hook starts rising up (retracting)
                this.disableCatch = false;
                this.firstDrop = false;
            }
        } else if (this.hook.isRetracting) {
            this.hook.y -= this.hook.retractSpeed; // controlled ascent
            // horizontal steering during ascent
            const horizontalSpeed = 3.2; // slightly faster
            if (this.input.left) this.hook.x -= horizontalSpeed;
            if (this.input.right) this.hook.x += horizontalSpeed;
            // clamp within canvas
            this.hook.x = Math.max(10, Math.min(this.canvas.width - 10, this.hook.x));
            
            // Enhanced swing physics for caught fish based on hook lateral velocity
            const hookVx = this.hook.x - this.prevHookX;
            if (this.hook.caughtFish && this.hook.caughtFish.length) {
                const targetAngle = Math.max(-1.2, Math.min(1.2, -hookVx * 0.15)); // stronger response
                this.hook.caughtFish.forEach(cf => {
                    if (cf.angle === undefined) cf.angle = 0;
                    if (cf.angVel === undefined) cf.angVel = 0;
                    cf.angVel += (targetAngle - cf.angle) * 0.25; // stronger spring
                    cf.angVel *= 0.85; // less damping for more swing
                    cf.angle += cf.angVel;
                });
            }
            if (this.hook.y <= this.penguin.y + this.hookOffsetY) {
                this.hook.isRetracting = false;
                this.hook.isDropping = false; // Ensure hook is completely idle
                // Reset retract speed to normal
                this.hook.retractSpeed = 4;
                // Snap back to penguin's rod base
                this.hook.x = this.penguin.x + this.hookOffsetX;
                this.hook.y = this.penguin.y + this.hookOffsetY;
                if (this.hook.caughtFish && this.hook.caughtFish.length) {
                    this.hook.caughtFish.forEach(fish => {
                        this.money += fish.value;
                        this.fishCount++;
                        this.updateUI();
                        // Create a floating popup near the hook/penguin with slight random offsets
                        const scatterX = (Math.random() - 0.5) * 18; // avoid stacking
                        const scatterY = (Math.random() - 0.5) * 12;
                        this.popups.push({
                            x: this.hook.x + scatterX,
                            y: this.hook.y + scatterY,
                            text: `+$${fish.value}`,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: -1.2 - Math.random() * 0.8,
                            alpha: 1,
                            life: 90
                        });
                    });
                    this.hook.caughtFish = [];
                }
                // End of first drop: re-enable catching for next runs
                if (this.disableCatch) {
                    this.disableCatch = false;
                    this.firstDrop = false;
                }
                
                // Show "TAP TO PLAY" after hook returns to indicate user can continue
                this.startScreen.classList.remove('hidden');
            }
        }
        this.prevHookX = this.hook.x;
    }

    updateCamera() {
        const worldBottom = this.waterLevel + this.maxDepthPx;
        // Follow hook, center it vertically when possible
        let target = this.hook.y - this.canvas.height * 0.5;
        // Clamp to world bounds (top at 0, bottom at worldBottom - canvas)
        const maxOffset = Math.max(0, worldBottom - this.canvas.height);
        this.cameraY = Math.max(0, Math.min(maxOffset, target));
    }
    
    updateFish() {
        this.fish.forEach((fish, index) => {
            // Move fish horizontally
            fish.x += fish.speed * fish.direction;
            
            // Add slight vertical movement for more natural swimming
            fish.y += Math.sin(this.ticks * 0.02 + fish.x * 0.01) * 0.3;
            
            // Keep fish within water bounds
            if (fish.y < this.waterLevel + 10) {
                fish.y = this.waterLevel + 10;
            } else if (fish.y > this.waterLevel + this.maxDepthPx + 100) {
                fish.y = this.waterLevel + this.maxDepthPx + 100;
            }
            
            // Remove fish that are off screen
            if (fish.x < -100 || fish.x > this.canvas.width + 100) {
                this.fish.splice(index, 1);
            }
        });
    }

    updateStars() {
        this.stars.forEach((star, index) => {
            // Move stars horizontally
            star.x += star.speed * star.direction;
            
            // Add slight vertical movement for floating effect
            star.y += Math.sin(this.ticks * 0.03 + star.x * 0.01) * 0.5;
            
            // Keep stars within water bounds
            if (star.y < this.waterLevel + 20) {
                star.y = this.waterLevel + 20;
            } else if (star.y > this.waterLevel + this.maxDepthPx + 50) {
                star.y = this.waterLevel + this.maxDepthPx + 50;
            }
            
            // Remove stars that are off screen
            if (star.x < -100 || star.x > this.canvas.width + 100) {
                this.stars.splice(index, 1);
            }
        });
    }
    
    checkCollisions() {
        this.fish.forEach((fish, fishIndex) => {
            if ((this.hook.isDropping || this.hook.isRetracting) && this.hook.caughtFish.length < this.maxFishPerDrop && !this.disableCatch) {
                const hookRect = {
                    x: this.hook.x - 5,
                    y: this.hook.y - 5,
                    width: 10,
                    height: 10
                };
                
                const fishRect = {
                    x: fish.x,
                    y: fish.y,
                    width: fish.width,
                    height: fish.height
                };
                
                if (this.rectCollision(hookRect, fishRect)) {
                    fish.angle = 0;
                    fish.angVel = 0;
                    this.hook.caughtFish.push(fish);
                    this.fish.splice(fishIndex, 1);
                    
                    // If we've reached the maximum fish capacity, start retracting immediately with faster speed
                    if (this.hook.caughtFish.length >= this.maxFishPerDrop) {
                        this.hook.isDropping = false;
                        this.hook.isRetracting = true;
                        this.hook.retractSpeed = 20; // Much faster retraction when full
                    } else {
                        this.hook.isDropping = false;
                        this.hook.isRetracting = true;
                    }
                }
            }
        });
        
        // Check for star collisions
        this.stars.forEach((star, starIndex) => {
            if (this.hook.isRetracting && !this.showStarPopup) {
                const hookRect = {
                    x: this.hook.x - 5,
                    y: this.hook.y - 5,
                    width: 10,
                    height: 10
                };
                
                const starRect = {
                    x: star.x,
                    y: star.y,
                    width: star.width,
                    height: star.height
                };
                
                if (this.rectCollision(hookRect, starRect)) {
                    // Remove the star
                    this.stars.splice(starIndex, 1);
                    
                    // Show question popup
                    this.showStarQuestion();
                }
            }
        });
    }
    
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    showStarQuestion() {
        // Select a random Gametize fact
        const randomIndex = Math.floor(Math.random() * this.gametizeFacts.length);
        this.currentStarQuestion = this.gametizeFacts[randomIndex];
        this.showStarPopup = true;
        
        // Pause the game
        this.gamePaused = true;
    }

    answerStarQuestion(selectedOption) {
        const isCorrect = selectedOption === this.currentStarQuestion.correct;
        
        if (isCorrect) {
            // Give bonus money for correct answer
            this.money += 50;
            this.updateUI();
            
            // Show success popup
            this.showStarResult(true, this.currentStarQuestion.fact);
        } else {
            // Show failure popup
            this.showStarResult(false, this.currentStarQuestion.fact);
        }
        
        // Reset after a delay
        setTimeout(() => {
            this.showStarPopup = false;
            this.currentStarQuestion = null;
            this.gamePaused = false;
        }, 3000);
    }

    showStarResult(isCorrect, fact) {
        // This will be handled in the draw function
        this.starResult = { isCorrect, fact };
        setTimeout(() => {
            this.starResult = null;
        }, 3000);
    }
    
    catchFish(fish) {
        this.money += fish.value;
        this.fishCount++;
        this.updateUI();
        // Create a floating popup near the hook/penguin with slight random offsets
        const scatterX = (Math.random() - 0.5) * 18; // avoid stacking
        const scatterY = (Math.random() - 0.5) * 12;
        this.popups.push({
            x: this.hook.x + scatterX,
            y: this.hook.y - 10 + scatterY,
            text: `+$${fish.value}`,
            alpha: 1,
            vy: -0.7,
            life: 64 // frames
        });
    }

    updatePopups() {
        this.popups = this.popups
            .map(p => ({ ...p, y: p.y + p.vy, alpha: p.alpha - 1/60, life: p.life - 1 }))
            .filter(p => p.life > 0 && p.alpha > 0);
    }
    
    updateUI() {
        if (this.moneyDisplay) {
            this.moneyDisplay.textContent = this.money;
        }
        if (this.fishCountDisplay) {
            this.fishCountDisplay.textContent = this.fishCount;
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(0, -this.cameraY);
        
        // Draw sky with warm gradient (teal → light yellow)
        const skyGradient = this.ctx.createLinearGradient(0, 0, 0, this.waterLevel);
        skyGradient.addColorStop(0, '#5FC2E7');    // top teal
        skyGradient.addColorStop(0.55, '#9FD8EA'); // mid soft blue
        skyGradient.addColorStop(1, '#F7D98B');    // near-horizon warm yellow
        this.ctx.fillStyle = skyGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.waterLevel);
        
        // Draw moving clouds
        this.drawClouds();
        
        // Draw underwater floating lights
        this.drawUnderwaterLights();
        
        // Draw brighter gradient water (lighter at surface → deeper blue below)
        const waterHeight = this.maxDepthPx + (this.canvas.height - this.waterLevel);
        const waterGradient = this.ctx.createLinearGradient(0, this.waterLevel, 0, this.waterLevel + waterHeight);
        waterGradient.addColorStop(0, '#90d4ff');   // bright surface
        waterGradient.addColorStop(1, '#1f5fa1');   // deeper water
        this.ctx.fillStyle = waterGradient;
        this.ctx.fillRect(0, this.waterLevel, this.canvas.width, waterHeight);
        // Decorative seabed walls and light streaks
        this.drawWaterDecor(waterHeight);
        
        // Draw penguin, line, hook, fish in world space
        this.drawPenguin();
        this.drawFishingLine();
        this.drawHook();
        this.drawFish();
        this.drawStars();
        if (this.hook.caughtFish) {
            this.drawCaughtFish();
        }
        // Draw popups on top
        this.drawPopups();
        this.ctx.restore();
        
        // Draw UI elements (not affected by camera)
        this.drawBucketUI();
        
        // Draw star popup if active
        if (this.showStarPopup && this.currentStarQuestion) {
            this.drawStarPopup();
        }
        
        // Draw star result if active
        if (this.starResult) {
            this.drawStarResult();
        }
        
        // Only show upgrade button when start screen is visible
        if (!this.startScreen.classList.contains('hidden')) {
            this.drawUpgradeButton();
        }
    }

    drawWaterDecor(waterHeight) {
        const ctx = this.ctx;
        // Side cliffs
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        const blockW = 36, blockH = 60;
        for (let y = this.waterLevel - 30; y < this.waterLevel + waterHeight; y += blockH) {
            // Left side stepped shapes
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(14, y + 8);
            ctx.lineTo(28, y + blockH * 0.4);
            ctx.lineTo(18, y + blockH * 0.75);
            ctx.lineTo(30, y + blockH);
            ctx.lineTo(0, y + blockH);
            ctx.closePath();
            ctx.fill();

            // Right side mirrored
            ctx.beginPath();
            ctx.moveTo(this.canvas.width, y);
            ctx.lineTo(this.canvas.width - 14, y + 8);
            ctx.lineTo(this.canvas.width - 28, y + blockH * 0.4);
            ctx.lineTo(this.canvas.width - 18, y + blockH * 0.75);
            ctx.lineTo(this.canvas.width - 30, y + blockH);
            ctx.lineTo(this.canvas.width, y + blockH);
            ctx.closePath();
            ctx.fill();
        }

        // Soft light streaks (bubbles/caustics)
        const streaks = 8;
        for (let i = 0; i < streaks; i++) {
            const y = this.waterLevel + 40 + i * 140;
            const x = (i % 2 === 0) ? this.canvas.width * 0.15 : this.canvas.width * 0.55;
            this.drawStreak(x, y, 140, 8, 0.28);
            this.drawStreak(x + 40, y + 16, 70, 6, 0.22);
            this.drawStreak(x + 90, y + 28, 40, 4, 0.18);
        }
    }

    drawStreak(x, y, w, h, alpha) {
        const ctx = this.ctx;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.fillStyle = '#bfe7ff';
        const r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    drawPopups() {
        if (!this.popups.length) return;
        this.ctx.font = 'bold 18px Arial';
        this.popups.forEach(p => {
            this.ctx.save();
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.fillStyle = '#ffe66d';
            this.ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(p.text, p.x, p.y);
            this.ctx.fillText(p.text, p.x, p.y);
            this.ctx.restore();
        });
    }

    drawBucketUI() {
        // Draw bucket in top right corner
        const bucketX = this.canvas.width - 80;
        const bucketY = 20;
        const bucketSize = 60;
        
        if (this.bucketImg) {
            // Use imageSmoothingEnabled for better quality
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
            this.ctx.drawImage(this.bucketImg, bucketX, bucketY, bucketSize, bucketSize);
        } else {
            // Fallback bucket
            this.ctx.fillStyle = '#87CEEB';
            this.ctx.fillRect(bucketX, bucketY, bucketSize, bucketSize);
        }
        
        // Draw remaining fish capacity (how many more can be caught in current drop)
        const remainingCapacity = this.maxFishPerDrop - this.hook.caughtFish.length;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.fillStyle = '#fff';
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 2;
        this.ctx.textAlign = 'center';
        this.ctx.strokeText(remainingCapacity.toString(), bucketX + bucketSize/2, bucketY + bucketSize/2 + 18);
        this.ctx.fillText(remainingCapacity.toString(), bucketX + bucketSize/2, bucketY + bucketSize/2 + 18);
        this.ctx.textAlign = 'left'; // reset alignment
    }

    drawUpgradeButton() {
        const ctx = this.ctx;
        const buttonX = (this.canvas.width - 120) / 2;
        const buttonY = this.canvas.height / 2 + 60;
        const buttonWidth = 120;
        const buttonHeight = 80;
        
        // Apply hover effect (slight scale and glow)
        if (this.isHoveringUpgrade) {
            ctx.save();
            // Scale up slightly
            const scale = 1.05;
            const scaledX = buttonX - (buttonWidth * (scale - 1)) / 2;
            const scaledY = buttonY - (buttonHeight * (scale - 1)) / 2;
            ctx.scale(scale, scale);
            
            // Add glow effect
            ctx.shadowColor = 'rgba(255, 255, 255, 0.3)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
        }
        
        // Draw container image if loaded, otherwise fallback to drawn design
        if (this.containerImg) {
            // Use imageSmoothingEnabled for better quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            const drawX = this.isHoveringUpgrade ? (buttonX - (buttonWidth * 0.05)) : buttonX;
            const drawY = this.isHoveringUpgrade ? (buttonY - (buttonHeight * 0.05)) : buttonY;
            ctx.drawImage(this.containerImg, drawX, drawY, buttonWidth, buttonHeight);
        } else {
            // Fallback drawn design
            const radius = 15;
            ctx.beginPath();
            ctx.roundRect(buttonX, buttonY, buttonWidth, buttonHeight, radius);
            ctx.closePath();
            
            // Solid orange-brown background with subtle gradient
            const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + buttonHeight);
            gradient.addColorStop(0, '#D2691E'); // Lighter orange-brown at top
            gradient.addColorStop(1, '#8B4513'); // Darker orange-brown at bottom
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Light colored inner layer (solid, not 3D)
            ctx.fillStyle = '#F4A460'; // Light sandy brown
            ctx.fillRect(buttonX + 4, buttonY + 4, buttonWidth - 8, buttonHeight - 8);
            
            // Border (dark brown)
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Reset shadow and scale if hovering
        if (this.isHoveringUpgrade) {
            ctx.restore();
        }
        
        // Text styling (always drawn on top)
        const currentSize = 4 + this.upgrades.bucketSize.level;
        const cost = this.getUpgradeCost('bucketSize');
        const canAfford = this.canAffordUpgrade('bucketSize');
        
        // "BUCKET SIZE" text (dark brown with subtle shadow)
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 14px DynaPuff, Arial';
        ctx.textAlign = 'center';
        ctx.fillText('BUCKET SIZE', buttonX + buttonWidth/2, buttonY + 22);
        
        // Current size text (dark brown with subtle shadow)
        ctx.fillStyle = '#8B4513';
        ctx.font = 'bold 18px DynaPuff, Arial';
        ctx.fillText(currentSize.toString(), buttonX + buttonWidth/2, buttonY + 45);
        
        // Cost text (white with dark shadow)
        ctx.fillStyle = canAfford ? '#FFFFFF' : '#FF6B6B';
        ctx.font = 'bold 16px DynaPuff, Arial';
        ctx.strokeStyle = '#2F1B14';
        ctx.lineWidth = 2;
        ctx.strokeText(`$${cost}`, buttonX + buttonWidth/2, buttonY + 68);
        ctx.fillText(`$${cost}`, buttonX + buttonWidth/2, buttonY + 68);
        
        ctx.textAlign = 'left'; // reset
    }


    getUpgradeCost(upgradeType) {
        const upgrade = this.upgrades[upgradeType];
        return Math.floor(upgrade.baseCost * Math.pow(upgrade.growthRate, upgrade.level));
    }

    canAffordUpgrade(upgradeType) {
        return this.money >= this.getUpgradeCost(upgradeType);
    }

    buyUpgrade(upgradeType) {
        if (!this.canAffordUpgrade(upgradeType)) return false;
        
        const cost = this.getUpgradeCost(upgradeType);
        this.money -= cost;
        this.upgrades[upgradeType].level++;
        
        // Apply upgrades immediately
        this.maxFishPerDrop = 4 + this.upgrades.bucketSize.level;
        
        this.updateUI();
        return true;
    }

    drawClouds() {
        this.clouds.forEach(cloud => {
            this.ctx.save();
            this.ctx.globalAlpha = cloud.opacity;
            this.ctx.fillStyle = '#ffffff';
            
            // Draw simple cloud shape with multiple circles
            const cloudX = cloud.x;
            const cloudY = cloud.y;
            const size = cloud.size;
            
            this.ctx.beginPath();
            this.ctx.arc(cloudX, cloudY, size * 0.4, 0, Math.PI * 2);
            this.ctx.arc(cloudX + size * 0.3, cloudY, size * 0.5, 0, Math.PI * 2);
            this.ctx.arc(cloudX + size * 0.6, cloudY, size * 0.3, 0, Math.PI * 2);
            this.ctx.arc(cloudX - size * 0.2, cloudY + size * 0.1, size * 0.35, 0, Math.PI * 2);
            this.ctx.arc(cloudX + size * 0.4, cloudY + size * 0.15, size * 0.4, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        });
    }

    drawUnderwaterLights() {
        this.underwaterLights.forEach(light => {
            this.ctx.save();
            this.ctx.globalAlpha = light.opacity;
            this.ctx.fillStyle = '#B8E6FF'; // Light blue-white color
            this.ctx.strokeStyle = '#E6F7FF'; // Even lighter blue for glow effect
            this.ctx.lineWidth = 1;
            
            const x = light.x;
            const y = light.y;
            const size = light.size;
            
            this.ctx.beginPath();
            
            if (light.type === 'pill') {
                // Draw pill shape (rounded rectangle)
                const pillWidth = size * 2;
                const pillHeight = size * 0.6;
                this.ctx.roundRect(x - pillWidth/2, y - pillHeight/2, pillWidth, pillHeight, size * 0.3);
            } else {
                // Draw circle
                this.ctx.arc(x, y, size, 0, Math.PI * 2);
            }
            
            this.ctx.fill();
            this.ctx.stroke();
            
            // Add inner glow effect
            this.ctx.globalAlpha = light.opacity * 0.5;
            this.ctx.fillStyle = '#FFFFFF';
            if (light.type === 'pill') {
                const pillWidth = size * 1.6;
                const pillHeight = size * 0.4;
                this.ctx.beginPath();
                this.ctx.roundRect(x - pillWidth/2, y - pillHeight/2, pillWidth, pillHeight, size * 0.2);
                this.ctx.fill();
            } else {
                this.ctx.beginPath();
                this.ctx.arc(x, y, size * 0.6, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            this.ctx.restore();
        });
    }
    
    drawPenguin() {
        // Penguin sprite (fallback to simple shape if not yet loaded)
        if (this.penguinImg) {
            this.ctx.drawImage(this.penguinImg, this.penguin.x, this.penguin.y, this.penguin.width, this.penguin.height);
        } else {
            this.ctx.fillStyle = '#000';
            this.ctx.fillRect(this.penguin.x, this.penguin.y, this.penguin.width, this.penguin.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(this.penguin.x + 8, this.penguin.y + 12, 34, 25);
            this.ctx.fillStyle = '#FFA500';
            this.ctx.fillRect(this.penguin.x + 38, this.penguin.y + 18, 12, 6);
        }
        
        // Fishing rod
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(this.penguin.x + 35, this.penguin.y + 20);
        this.ctx.lineTo(this.penguin.x + 55, this.penguin.y + 12);
        this.ctx.stroke();
    }
    
    drawFishingLine() {
        this.ctx.strokeStyle = '#000';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(this.penguin.x + this.rodTipOffsetX, this.penguin.y + this.rodTipOffsetY);
        this.ctx.lineTo(this.hook.x, this.hook.y);
        this.ctx.stroke();
    }
    
    drawHook() {
        if (this.hookImg) {
            // Draw hook sprite with high quality scaling
            this.ctx.imageSmoothingEnabled = true;
            this.ctx.imageSmoothingQuality = 'high';
            this.ctx.drawImage(
                this.hookImg,
                this.hook.x - 26,
                this.hook.y - 10,
                35,  // width - increased hook size
                50   // height - increased hook size
            );
        } else {
            // Fallback to simple drawn hook
            this.ctx.fillStyle = '#C0C0C0';
            this.ctx.fillRect(this.hook.x - 2, this.hook.y - 2, 4, 4);
            
            // Hook point
            this.ctx.strokeStyle = '#C0C0C0';
            this.ctx.lineWidth = 1.5;
            this.ctx.beginPath();
            this.ctx.moveTo(this.hook.x + 2, this.hook.y);
            this.ctx.lineTo(this.hook.x + 6, this.hook.y - 2);
            this.ctx.stroke();
        }
    }
    
    drawFish() {
        this.fish.forEach(fish => {
            if (this.fishSprites[fish.type]) {
                // Draw fish sprite
                this.ctx.save();
                
                // Flip sprite if moving left
                if (fish.direction < 0) {
                    this.ctx.scale(-1, 1);
                    this.ctx.drawImage(
                        this.fishSprites[fish.type],
                        -fish.x - fish.width,
                        fish.y,
                        fish.width,
                        fish.height
                    );
                } else {
                    this.ctx.drawImage(
                        this.fishSprites[fish.type],
                        fish.x,
                        fish.y,
                        fish.width,
                        fish.height
                    );
                }
                
                this.ctx.restore();
            } else {
                // Fallback to colored rectangle if sprite not loaded
                this.ctx.fillStyle = '#FF6B6B';
                this.ctx.fillRect(fish.x, fish.y, fish.width, fish.height);
            }
        });
    }
    
    drawCaughtFish() {
        const offsetStep = 10; // spread caught fish around the hook
        const baseOffset = 25; // Initial offset from the hook tip (moved down)
        this.hook.caughtFish.forEach((fish, i) => {
            const dx = ((i % 3) - 1) * offsetStep;
            const dy = baseOffset - Math.floor(i / 3) * offsetStep;
            const cx = this.hook.x + dx;
            const cy = this.hook.y + dy;
            this.ctx.save();
            // Rotate to face upward along the line (sprite originally faces right)
            this.ctx.translate(cx, cy);
            this.ctx.rotate(-Math.PI / 2 + (fish.angle || 0)); // add swing angle
            if (this.fishSprites[fish.type]) {
                this.ctx.drawImage(
                    this.fishSprites[fish.type],
                    -fish.width / 2,
                    -fish.height / 2,
                    fish.width,
                    fish.height
                );
            } else {
                this.ctx.fillStyle = '#FF6B6B';
                this.ctx.fillRect(-fish.width / 2, -fish.height / 2, fish.width, fish.height);
            }
            this.ctx.restore();
        });
    }

    drawStars() {
        this.stars.forEach(star => {
            this.ctx.save();
            this.ctx.translate(star.x + star.width / 2, star.y + star.height / 2);
            
            if (this.starImg) {
                this.ctx.imageSmoothingEnabled = true;
                this.ctx.imageSmoothingQuality = 'high';
                this.ctx.drawImage(
                    this.starImg,
                    -star.width / 2,
                    -star.height / 2,
                    star.width,
                    star.height
                );
            } else {
                // Fallback star shape
                this.ctx.fillStyle = '#FFD700';
                this.ctx.strokeStyle = '#FFA500';
                this.ctx.lineWidth = 2;
                
                // Draw a simple star
                this.ctx.beginPath();
                for (let i = 0; i < 5; i++) {
                    const angle = (i * 4 * Math.PI) / 5;
                    const x = Math.cos(angle) * (star.width / 2);
                    const y = Math.sin(angle) * (star.height / 2);
                    if (i === 0) {
                        this.ctx.moveTo(x, y);
                    } else {
                        this.ctx.lineTo(x, y);
                    }
                }
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        });
    }

    drawStarPopup() {
        const ctx = this.ctx;
        const popupWidth = 300;
        const popupHeight = 200;
        const popupX = (this.canvas.width - popupWidth) / 2;
        const popupY = (this.canvas.height - popupHeight) / 2;
        
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Popup background
        ctx.fillStyle = '#2C3E50';
        ctx.strokeStyle = '#34495E';
        ctx.lineWidth = 3;
        ctx.fillRect(popupX, popupY, popupWidth, popupHeight);
        ctx.strokeRect(popupX, popupY, popupWidth, popupHeight);
        
        // Question text
        ctx.fillStyle = '#ECF0F1';
        ctx.font = 'bold 18px DynaPuff, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.currentStarQuestion.question, popupX + popupWidth / 2, popupY + 40);
        
        // Answer options
        ctx.font = '16px DynaPuff, Arial';
        this.currentStarQuestion.options.forEach((option, index) => {
            const optionY = popupY + 80 + (index * 30);
            const optionX = popupX + 20;
            const optionWidth = popupWidth - 40;
            const optionHeight = 25;
            
            // Option background
            ctx.fillStyle = '#34495E';
            ctx.fillRect(optionX, optionY - 15, optionWidth, optionHeight);
            
            // Option text
            ctx.fillStyle = '#ECF0F1';
            ctx.textAlign = 'left';
            ctx.fillText(`${String.fromCharCode(65 + index)}. ${option}`, optionX + 10, optionY);
            
            // Make options clickable (this would need event handling)
            // For now, we'll add click areas that can be handled by the existing click handler
        });
        
        ctx.textAlign = 'center';
    }

    drawStarResult() {
        const ctx = this.ctx;
        const resultWidth = 280;
        const resultHeight = 120;
        const resultX = (this.canvas.width - resultWidth) / 2;
        const resultY = (this.canvas.height - resultHeight) / 2;
        
        // Dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Result background
        ctx.fillStyle = this.starResult.isCorrect ? '#27AE60' : '#E74C3C';
        ctx.strokeStyle = this.starResult.isCorrect ? '#2ECC71' : '#C0392B';
        ctx.lineWidth = 3;
        ctx.fillRect(resultX, resultY, resultWidth, resultHeight);
        ctx.strokeRect(resultX, resultY, resultWidth, resultHeight);
        
        // Result text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px DynaPuff, Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            this.starResult.isCorrect ? 'Correct! +$50' : 'Incorrect!',
            resultX + resultWidth / 2,
            resultY + 40
        );
        
        // Fact text
        ctx.font = '14px DynaPuff, Arial';
        ctx.fillText(
            this.starResult.fact,
            resultX + resultWidth / 2,
            resultY + 80
        );
    }
    
    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    new FishingGame();
});
