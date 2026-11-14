class TimelineEngine {
    constructor() {
        this.profiles = new Map(); // profileName -> Profile Object
        this.currentProfile = null;
        
        this.isPlaying = false;
        this.currentFrame = 0;
        this.fps = 30;
        
        this.onFrameUpdate = null; // Callback for UI updates
    }

    addProfile(name, frameRate, loop, tracks, easing = 'linear', repoFrames = 0) {
        this.profiles.set(name, {
            name,
            frameRate,
            loop,
            keyframes: tracks || [], // We'll keep the param name 'tracks' for backward compatibility, but it's now keyframes: [{time, poseData: {jointId: {localX, localY}}}]
            easing,
            repoFrames
        });
        
        if (!this.currentProfile) {
            this.setProfile(name);
        }
    }

    setProfile(name) {
        if (this.profiles.has(name)) {
            this.currentProfile = this.profiles.get(name);
            this.fps = this.currentProfile.frameRate || 30;
            this.currentFrame = 0;
        }
    }

    play() {
        this.isPlaying = true;
    }

    pause() {
        this.isPlaying = false;
    }

    togglePlay() {
        this.isPlaying = !this.isPlaying;
        return this.isPlaying;
    }

    scrubTo(frame, jointEngine) {
        if (frame < 0) frame = 0;
        let maxFrames = 59;
        if (this.currentProfile && this.currentProfile.keyframes.length > 0) {
            const lastKfTime = this.currentProfile.keyframes[this.currentProfile.keyframes.length - 1].time;
            const repo = this.currentProfile.repoFrames || 0;
            maxFrames = Math.max(59, lastKfTime) + repo;
        }
        if (frame > maxFrames) frame = maxFrames;
        this.currentFrame = frame;
        if (jointEngine) this.applyInterpolation(jointEngine);
        if (this.onFrameUpdate) this.onFrameUpdate(this.currentFrame);
    }

    stepForward(jointEngine) {
        this.scrubTo(this.currentFrame + 1, jointEngine);
    }

    stepBackward(jointEngine) {
        this.scrubTo(this.currentFrame - 1, jointEngine);
    }

    update(deltaTime, jointEngine) {
        if (!this.isPlaying || !this.currentProfile) return;

        const frameTimeMs = 1000 / this.fps;
        
        this.timeAccumulator = (this.timeAccumulator || 0) + deltaTime;
        if (this.timeAccumulator >= frameTimeMs) {
            this.timeAccumulator -= frameTimeMs;
            this.currentFrame++;
            
            let maxFrames = 59; 
            if (this.currentProfile && this.currentProfile.keyframes.length > 0) {
                const lastKfTime = this.currentProfile.keyframes[this.currentProfile.keyframes.length - 1].time;
                const repo = this.currentProfile.repoFrames || 0;
                maxFrames = Math.max(59, lastKfTime) + repo;
            }
            
            if (this.currentFrame > maxFrames) {
                if (this.currentProfile.loop) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = maxFrames;
                    this.isPlaying = false;
                }
            }

            this.applyInterpolation(jointEngine);
            
            if (this.onFrameUpdate) {
                this.onFrameUpdate(this.currentFrame);
            }
        }
    }

    applyInterpolation(jointEngine) {
        if (!this.currentProfile) return;

        const keyframes = this.currentProfile.keyframes;
        if (!keyframes || keyframes.length === 0) return;

        const lastKfTime = keyframes[keyframes.length - 1].time;
        const repoFrames = this.currentProfile.repoFrames || 0;
        const baseLength = Math.max(59, lastKfTime);
        const maxFrames = baseLength + repoFrames;

        let timeFrame = this.currentFrame;
        if (timeFrame > maxFrames) timeFrame = maxFrames;

        let kfPrev = keyframes[0];
        let kfNext = keyframes[0];

        if (timeFrame <= keyframes[0].time) {
            kfPrev = keyframes[0];
            kfNext = keyframes[0];
        } else if (timeFrame >= baseLength) {
            if (repoFrames > 0 && timeFrame <= baseLength + repoFrames) {
                kfPrev = { ...keyframes[keyframes.length - 1], time: baseLength };
                kfNext = { ...keyframes[0], time: baseLength + repoFrames };
            } else {
                kfPrev = keyframes[keyframes.length - 1];
                kfNext = keyframes[keyframes.length - 1];
            }
        } else if (timeFrame > lastKfTime) {
            kfPrev = keyframes[keyframes.length - 1];
            kfNext = keyframes[keyframes.length - 1];
        } else {
            for (let i = 0; i < keyframes.length - 1; i++) {
                if (timeFrame >= keyframes[i].time && timeFrame <= keyframes[i+1].time) {
                    kfPrev = keyframes[i];
                    kfNext = keyframes[i+1];
                    break;
                }
            }
        }

        const allJoints = jointEngine.getAllJoints();
        
        if (kfPrev === kfNext) {
            // Exact match or outside bounds
            for (const joint of allJoints) {
                const pd = kfPrev.poseData[joint.id];
                if (pd) {
                    if (pd.localX !== undefined) joint.localX = pd.localX;
                    if (pd.localY !== undefined) joint.localY = pd.localY;
                }
            }
        } else {
            // Interpolation
            let t = (timeFrame - kfPrev.time) / (kfNext.time - kfPrev.time);
            
            const easeType = this.currentProfile.easing || 'linear';
            if (easeType === 'ease-in-out') {
                t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            } else if (easeType === 'ease-out') {
                t = 1 - Math.pow(1 - t, 3);
            } else if (easeType === 'ease-in') {
                t = t * t * t;
            }
            
            for (const joint of allJoints) {
                const pdPrev = kfPrev.poseData[joint.id];
                const pdNext = kfNext.poseData[joint.id];
                
                if (pdPrev && pdNext) {
                    if (joint.parentId) {
                        // Polar interpolation for child joints (arcs)
                        const r1 = Math.hypot(pdPrev.localX || 0, pdPrev.localY || 0);
                        const a1 = Math.atan2(pdPrev.localY || 0, pdPrev.localX || 0);
                        const r2 = Math.hypot(pdNext.localX || 0, pdNext.localY || 0);
                        const a2 = Math.atan2(pdNext.localY || 0, pdNext.localX || 0);
                        
                        const r = r1 + (r2 - r1) * t;
                        let diff = a2 - a1;
                        while (diff < -Math.PI) diff += 2 * Math.PI;
                        while (diff > Math.PI) diff -= 2 * Math.PI;
                        const a = a1 + diff * t;
                        
                        joint.localX = r * Math.cos(a);
                        joint.localY = r * Math.sin(a);
                    } else {
                        // Linear interpolation for root joints (translation)
                        if (pdPrev.localX !== undefined && pdNext.localX !== undefined) {
                            joint.localX = pdPrev.localX + (pdNext.localX - pdPrev.localX) * t;
                        }
                        if (pdPrev.localY !== undefined && pdNext.localY !== undefined) {
                            joint.localY = pdPrev.localY + (pdNext.localY - pdPrev.localY) * t;
                        }
                    }
                } else if (pdPrev) {
                    if (pdPrev.localX !== undefined) joint.localX = pdPrev.localX;
                    if (pdPrev.localY !== undefined) joint.localY = pdPrev.localY;
                }
            }
        }

        jointEngine.updateWorldPositions();
    }

    addKeyframe(profileName, frame, jointEngine) {
        if (!this.profiles.has(profileName)) {
            // Create a default profile if it doesn't exist
            this.addProfile(profileName, 30, true, []);
        }
        const profile = this.profiles.get(profileName);
        
        const poseData = {};
        for (const joint of jointEngine.getAllJoints()) {
            poseData[joint.id] = { localX: joint.localX, localY: joint.localY };
        }
        
        // Find existing keyframe at this time, or add new
        const existingKfIndex = profile.keyframes.findIndex(k => k.time === frame);
        if (existingKfIndex >= 0) {
            profile.keyframes[existingKfIndex].poseData = poseData;
            return false; // indicates updated
        } else {
            profile.keyframes.push({ time: frame, poseData });
            // Sort keyframes by time ascending
            profile.keyframes.sort((a, b) => a.time - b.time);
            return true; // indicates added
        }
    }

    removeKeyframe(profileName, frame) {
        if (!this.profiles.has(profileName)) return;
        const profile = this.profiles.get(profileName);
        
        const existingKfIndex = profile.keyframes.findIndex(k => k.time === frame);
        if (existingKfIndex >= 0) {
            profile.keyframes.splice(existingKfIndex, 1);
        }
    }
}
