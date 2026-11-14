const DEFAULT_HERO_CHARAGEN_PROFILE = {"$schema":"https://charagen.dev/schemas/character-profile.v2.json","name":"HeroMaker_Vanguard","templateClass":"Based on Humanoid","classCategory":"humanoid","version":"2.0.0","metadata":{"author":"CharaGen","createdTimestamp":1794175888357,"compatibleGames":["HeroMaker"]},"skinState":{"active":true,"materialColor":"#f4c29f"},"graph":{"joints":[{"id":"pelvis","label":"Pelvis","x":0,"y":-144,"radius":18},{"id":"spine","label":"Spine","x":1.745,"y":-193.97,"radius":16},{"id":"chest","label":"Chest","x":4.362,"y":-243.901,"radius":20},{"id":"neck","label":"Neck","x":5.06,"y":-263.889,"radius":10},{"id":"head","label":"Head","x":6.456,"y":-303.865,"radius":24},{"id":"shoulder_l","label":"Shoulder L","x":-5.638,"y":-243.901,"radius":13},{"id":"elbow_l","label":"Elbow L","x":-33.806,"y":-190.924,"radius":11},{"id":"hand_l","label":"Hand L","x":-5.127,"y":-149.966,"radius":9},{"id":"fingers_l","label":"Fingers L","x":4.873,"y":-132.645,"radius":7},{"id":"shoulder_r","label":"Shoulder R","x":14.362,"y":-243.901,"radius":13},{"id":"elbow_r","label":"Elbow R","x":51.302,"y":-196.62,"radius":11},{"id":"hand_r","label":"Hand R","x":98.855,"y":-212.071,"radius":9},{"id":"fingers_r","label":"Fingers R","x":118.418,"y":-216.229,"radius":7},{"id":"hip_l","label":"Hip L","x":-5,"y":-144,"radius":14},{"id":"knee_l","label":"Knee L","x":-20.593,"y":-70.639,"radius":12},{"id":"foot_l","label":"Foot L","x":-23.036,"y":-0.682,"radius":10},{"id":"toe_l","label":"Toe L","x":-8.036,"y":-0.682,"radius":8},{"id":"hip_r","label":"Hip R","x":5,"y":-144,"radius":14},{"id":"knee_r","label":"Knee R","x":20.593,"y":-70.639,"radius":12},{"id":"foot_r","label":"Foot R","x":23.036,"y":-0.682,"radius":10},{"id":"toe_r","label":"Toe R","x":38.036,"y":-0.682,"radius":8}],"connections":[{"id":"pelvis_spine","label":"pelvis_spine","jointA":"pelvis","jointB":"spine"},{"id":"spine_chest","label":"spine_chest","jointA":"spine","jointB":"chest"},{"id":"chest_neck","label":"chest_neck","jointA":"chest","jointB":"neck"},{"id":"neck_head","label":"neck_head","jointA":"neck","jointB":"head"},{"id":"clavicle_l","label":"clavicle_l","jointA":"chest","jointB":"shoulder_l"},{"id":"arm_u_l","label":"arm_u_l","jointA":"shoulder_l","jointB":"elbow_l"},{"id":"arm_l_l","label":"arm_l_l","jointA":"elbow_l","jointB":"hand_l"},{"id":"fingers_conn_l","label":"fingers_conn_l","jointA":"hand_l","jointB":"fingers_l"},{"id":"clavicle_r","label":"clavicle_r","jointA":"chest","jointB":"shoulder_r"},{"id":"arm_u_r","label":"arm_u_r","jointA":"shoulder_r","jointB":"elbow_r"},{"id":"arm_l_r","label":"arm_l_r","jointA":"elbow_r","jointB":"hand_r"},{"id":"fingers_conn_r","label":"fingers_conn_r","jointA":"hand_r","jointB":"fingers_r"},{"id":"pelvis_l","label":"pelvis_l","jointA":"pelvis","jointB":"hip_l"},{"id":"leg_u_l","label":"leg_u_l","jointA":"hip_l","jointB":"knee_l"},{"id":"leg_l_l","label":"leg_l_l","jointA":"knee_l","jointB":"foot_l"},{"id":"toe_conn_l","label":"toe_conn_l","jointA":"foot_l","jointB":"toe_l"},{"id":"pelvis_r","label":"pelvis_r","jointA":"pelvis","jointB":"hip_r"},{"id":"leg_u_r","label":"leg_u_r","jointA":"hip_r","jointB":"knee_r"},{"id":"leg_l_r","label":"leg_l_r","jointA":"knee_r","jointB":"foot_r"},{"id":"toe_conn_r","label":"toe_conn_r","jointA":"foot_r","jointB":"toe_r"}]},"anchorPoints":[{"anchorId":"anchor_headwear","connectionId":"neck_head","slotType":"headwear","positionPercent":0.85,"rotationOffset":1.57,"scale":0.95},{"anchorId":"anchor_top_body","connectionId":"spine_chest","slotType":"topBody","positionPercent":0.45,"rotationOffset":1.57,"scale":0.95},{"anchorId":"anchor_leg_l","connectionId":"leg_u_l","slotType":"legs","positionPercent":0.5,"rotationOffset":-1.57,"scale":0.85},{"anchorId":"anchor_leg_r","connectionId":"leg_u_r","slotType":"legs","positionPercent":0.5,"rotationOffset":-1.57,"scale":0.85},{"anchorId":"anchor_foot_l","connectionId":"toe_conn_l","slotType":"feet","positionPercent":0.35,"rotationOffset":0.0,"scale":0.85},{"anchorId":"anchor_foot_r","connectionId":"toe_conn_r","slotType":"feet","positionPercent":0.35,"rotationOffset":0.0,"scale":0.85},{"anchorId":"anchor_main_weapon","connectionId":"fingers_conn_r","slotType":"mainWeapon","positionPercent":0.5,"rotationOffset":1.57,"scale":0.95}],"equipmentSlots":{"headwear":{"itemId":"hero_helm_cloth","itemClass":"headwear"},"topBody":{"itemId":"hero_tunic_cloth","itemClass":"topBody"},"legs":{"itemId":"hero_greaves_cloth","itemClass":"legs"},"feet":{"itemId":"hero_boots_leather","itemClass":"feet"},"mainWeapon":{"itemId":"sword_wood","itemClass":"mainWeapon"}},"inventory":{"headwear":[{"id":"hero_helm_cloth","name":"Adventurer Bandana","pivotX":0.5,"pivotY":0.65,"assetUri":"data:image/svg+xml;utf8,<svg width='70' height='60' xmlns='http://www.w3.org/2000/svg'><path d='M10,38 Q35,6 60,38 Z' fill='%23f59e0b' stroke='%2378350f' stroke-width='3'/><rect x='8' y='34' width='54' height='9' rx='4' fill='%23b45309'/><circle cx='48' cy='26' r='4' fill='%23fef08a'/></svg>"}],"topBody":[{"id":"hero_tunic_cloth","name":"Cloth Tunic","pivotX":0.5,"pivotY":0.45,"assetUri":"data:image/svg+xml;utf8,<svg width='76' height='110' xmlns='http://www.w3.org/2000/svg'><rect x='12' y='8' width='52' height='92' rx='14' fill='%23eab308' stroke='%23713f12' stroke-width='3'/><rect x='10' y='64' width='56' height='12' rx='3' fill='%2378350f'/><rect x='32' y='62' width='12' height='16' rx='2' fill='%23fde047'/></svg>"}],"legs":[{"id":"hero_greaves_cloth","name":"Ranger Greaves","pivotX":0.5,"pivotY":0.5,"assetUri":"data:image/svg+xml;utf8,<svg width='40' height='76' xmlns='http://www.w3.org/2000/svg'><rect x='6' y='4' width='28' height='68' rx='8' fill='%2378350f' stroke='%23451a03' stroke-width='2.5'/></svg>"}],"feet":[{"id":"hero_boots_leather","name":"Traveler Boots","pivotX":0.35,"pivotY":0.5,"assetUri":"data:image/svg+xml;utf8,<svg width='52' height='36' xmlns='http://www.w3.org/2000/svg'><path d='M8,6 L30,6 L46,24 L46,32 L8,32 Z' fill='%23451a03' stroke='%2327272a' stroke-width='2'/></svg>"}],"mainWeapon":[{"id":"sword_wood","name":"Wooden Sword","pivotX":0.5,"pivotY":0.86,"assetUri":"data:image/svg+xml;utf8,<svg width='48' height='160' xmlns='http://www.w3.org/2000/svg'><polygon points='24,4 33,24 31,122 17,122 15,24' fill='%23deb887' stroke='%2378350f' stroke-width='2.5'/><line x1='24' y1='14' x2='24' y2='118' stroke='%23fef3c7' stroke-width='2'/><rect x='8' y='120' width='32' height='10' rx='3' fill='%23f59e0b' stroke='%2378350f' stroke-width='2'/><rect x='20' y='130' width='8' height='22' rx='2' fill='%2378350f'/><circle cx='24' cy='154' r='5' fill='%23fbbf24'/></svg>"}]},"movementProfiles":{"Idle 1":{"frameRate":30,"loop":true,"keyframes":[{"time":0,"poseData":{"pelvis":{"localX":0,"localY":-144},"spine":{"localX":1.745,"localY":-49.97},"chest":{"localX":2.617,"localY":-49.931},"neck":{"localX":0.698,"localY":-19.988},"head":{"localX":1.396,"localY":-39.976},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-28.168,"localY":52.977},"hand_l":{"localX":28.679,"localY":40.958},"fingers_l":{"localX":10.0,"localY":17.321},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":36.94,"localY":47.281},"hand_r":{"localX":47.553,"localY":-15.451},"fingers_r":{"localX":19.563,"localY":-4.158},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-15.593,"localY":73.361},"foot_l":{"localX":-2.443,"localY":69.957},"toe_l":{"localX":15.0,"localY":0.0},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":15.593,"localY":73.361},"foot_r":{"localX":2.443,"localY":69.957},"toe_r":{"localX":15.0,"localY":0.0}}},{"time":30,"poseData":{"pelvis":{"localX":0,"localY":-140},"spine":{"localX":4.358,"localY":-49.81},"chest":{"localX":5.226,"localY":-49.726},"neck":{"localX":1.395,"localY":-19.951},"head":{"localX":3.486,"localY":-39.848},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-33.552,"localY":49.742},"hand_l":{"localX":23.474,"localY":44.147},"fingers_l":{"localX":8.135,"localY":18.271},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":31.795,"localY":50.883},"hand_r":{"localX":49.24,"localY":-8.682},"fingers_r":{"localX":19.924,"localY":-1.743},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-19.411,"localY":72.444},"foot_l":{"localX":1.222,"localY":69.989},"toe_l":{"localX":15.0,"localY":0.0},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":19.411,"localY":72.444},"foot_r":{"localX":-1.222,"localY":69.989},"toe_r":{"localX":15.0,"localY":0.0}}},{"time":59,"poseData":{"pelvis":{"localX":0,"localY":-144},"spine":{"localX":1.745,"localY":-49.97},"chest":{"localX":2.617,"localY":-49.931},"neck":{"localX":0.698,"localY":-19.988},"head":{"localX":1.396,"localY":-39.976},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-28.168,"localY":52.977},"hand_l":{"localX":28.679,"localY":40.958},"fingers_l":{"localX":10.0,"localY":17.321},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":36.94,"localY":47.281},"hand_r":{"localX":47.553,"localY":-15.451},"fingers_r":{"localX":19.563,"localY":-4.158},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-15.593,"localY":73.361},"foot_l":{"localX":-2.443,"localY":69.957},"toe_l":{"localX":15.0,"localY":0.0},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":15.593,"localY":73.361},"foot_r":{"localX":2.443,"localY":69.957},"toe_r":{"localX":15.0,"localY":0.0}}}],"easing":"ease-in-out","repoFrames":0},"Walk":{"frameRate":30,"loop":true,"keyframes":[{"time":0,"poseData":{"pelvis":{"localX":0,"localY":-142},"spine":{"localX":4.358,"localY":-49.81},"chest":{"localX":5.226,"localY":-49.726},"neck":{"localX":1.395,"localY":-19.951},"head":{"localX":2.79,"localY":-39.903},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":34.415,"localY":49.149},"hand_l":{"localX":48.296,"localY":12.941},"fingers_l":{"localX":18.794,"localY":6.84},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":-31.795,"localY":50.883},"hand_r":{"localX":12.941,"localY":48.296},"fingers_r":{"localX":5.176,"localY":19.319},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-35.21,"localY":66.221},"foot_l":{"localX":-43.096,"localY":55.161},"toe_l":{"localX":14.489,"localY":3.882},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":35.21,"localY":66.221},"foot_r":{"localX":14.554,"localY":68.47},"toe_r":{"localX":14.854,"localY":-2.088}}},{"time":15,"poseData":{"pelvis":{"localX":0,"localY":-146},"spine":{"localX":2.617,"localY":-49.931},"chest":{"localX":3.488,"localY":-49.878},"neck":{"localX":1.047,"localY":-19.973},"head":{"localX":2.093,"localY":-39.945},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":2.094,"localY":59.963},"hand_l":{"localX":35.355,"localY":35.355},"fingers_l":{"localX":14.142,"localY":14.142},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":2.094,"localY":59.963},"hand_r":{"localX":40.958,"localY":28.679},"fingers_r":{"localX":16.383,"localY":11.472},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":6.537,"localY":74.715},"foot_l":{"localX":-49.497,"localY":49.497},"toe_l":{"localX":14.095,"localY":5.13},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":2.617,"localY":74.954},"foot_r":{"localX":0.0,"localY":70.0},"toe_r":{"localX":15.0,"localY":0.0}}},{"time":30,"poseData":{"pelvis":{"localX":0,"localY":-142},"spine":{"localX":4.358,"localY":-49.81},"chest":{"localX":5.226,"localY":-49.726},"neck":{"localX":1.395,"localY":-19.951},"head":{"localX":2.79,"localY":-39.903},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-31.795,"localY":50.883},"hand_l":{"localX":12.941,"localY":48.296},"fingers_l":{"localX":5.176,"localY":19.319},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":34.415,"localY":49.149},"hand_r":{"localX":48.296,"localY":12.941},"fingers_r":{"localX":18.794,"localY":6.84},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":35.21,"localY":66.221},"foot_l":{"localX":14.554,"localY":68.47},"toe_l":{"localX":14.854,"localY":-2.088},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":-35.21,"localY":66.221},"foot_r":{"localX":-43.096,"localY":55.161},"toe_r":{"localX":14.489,"localY":3.882}}},{"time":45,"poseData":{"pelvis":{"localX":0,"localY":-146},"spine":{"localX":2.617,"localY":-49.931},"chest":{"localX":3.488,"localY":-49.878},"neck":{"localX":1.047,"localY":-19.973},"head":{"localX":2.093,"localY":-39.945},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":2.094,"localY":59.963},"hand_l":{"localX":35.355,"localY":35.355},"fingers_l":{"localX":14.142,"localY":14.142},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":2.094,"localY":59.963},"hand_r":{"localX":40.958,"localY":28.679},"fingers_r":{"localX":16.383,"localY":11.472},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":2.617,"localY":74.954},"foot_l":{"localX":0.0,"localY":70.0},"toe_l":{"localX":15.0,"localY":0.0},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":6.537,"localY":74.715},"foot_r":{"localX":-49.497,"localY":49.497},"toe_r":{"localX":14.095,"localY":5.13}}},{"time":59,"poseData":{"pelvis":{"localX":0,"localY":-142},"spine":{"localX":4.358,"localY":-49.81},"chest":{"localX":5.226,"localY":-49.726},"neck":{"localX":1.395,"localY":-19.951},"head":{"localX":2.79,"localY":-39.903},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":34.415,"localY":49.149},"hand_l":{"localX":48.296,"localY":12.941},"fingers_l":{"localX":18.794,"localY":6.84},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":-31.795,"localY":50.883},"hand_r":{"localX":12.941,"localY":48.296},"fingers_r":{"localX":5.176,"localY":19.319},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-35.21,"localY":66.221},"foot_l":{"localX":-43.096,"localY":55.161},"toe_l":{"localX":14.489,"localY":3.882},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":35.21,"localY":66.221},"foot_r":{"localX":14.554,"localY":68.47},"toe_r":{"localX":14.854,"localY":-2.088}}}],"easing":"linear","repoFrames":0},"Run":{"frameRate":45,"loop":true,"keyframes":[{"time":0,"poseData":{"pelvis":{"localX":0,"localY":-136},"spine":{"localX":12.096,"localY":-48.515},"chest":{"localX":13.782,"localY":-48.063},"neck":{"localX":3.473,"localY":-19.696},"head":{"localX":4.181,"localY":-39.781},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":50.883,"localY":31.795},"hand_l":{"localX":45.315,"localY":-21.131},"fingers_l":{"localX":18.794,"localY":-6.84},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":-47.281,"localY":36.94},"hand_r":{"localX":4.358,"localY":49.81},"fingers_r":{"localX":1.743,"localY":19.924},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-50.185,"localY":55.736},"foot_l":{"localX":-63.442,"localY":29.583},"toe_l":{"localX":13.595,"localY":6.339},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":55.736,"localY":50.185},"foot_r":{"localX":21.631,"localY":66.574},"toe_r":{"localX":14.489,"localY":-3.882}}},{"time":15,"poseData":{"pelvis":{"localX":0,"localY":-146},"spine":{"localX":10.396,"localY":-48.907},"chest":{"localX":12.096,"localY":-48.515},"neck":{"localX":2.783,"localY":-19.805},"head":{"localX":3.486,"localY":-39.848},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":5.229,"localY":59.772},"hand_l":{"localX":45.315,"localY":21.131},"fingers_l":{"localX":18.126,"localY":8.452},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":5.229,"localY":59.772},"hand_r":{"localX":46.985,"localY":17.101},"fingers_r":{"localX":18.794,"localY":6.84},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":23.176,"localY":71.329},"foot_l":{"localX":-57.341,"localY":40.15},"toe_l":{"localX":14.095,"localY":5.13},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":2.617,"localY":74.954},"foot_r":{"localX":-7.317,"localY":69.617},"toe_r":{"localX":14.943,"localY":1.307}}},{"time":30,"poseData":{"pelvis":{"localX":0,"localY":-136},"spine":{"localX":12.096,"localY":-48.515},"chest":{"localX":13.782,"localY":-48.063},"neck":{"localX":3.473,"localY":-19.696},"head":{"localX":4.181,"localY":-39.781},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-47.281,"localY":36.94},"hand_l":{"localX":4.358,"localY":49.81},"fingers_l":{"localX":1.743,"localY":19.924},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":50.883,"localY":31.795},"hand_r":{"localX":45.315,"localY":-21.131},"fingers_r":{"localX":18.794,"localY":-6.84},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":55.736,"localY":50.185},"foot_l":{"localX":21.631,"localY":66.574},"toe_l":{"localX":14.489,"localY":-3.882},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":-50.185,"localY":55.736},"foot_r":{"localX":-63.442,"localY":29.583},"toe_r":{"localX":13.595,"localY":6.339}}},{"time":45,"poseData":{"pelvis":{"localX":0,"localY":-146},"spine":{"localX":10.396,"localY":-48.907},"chest":{"localX":12.096,"localY":-48.515},"neck":{"localX":2.783,"localY":-19.805},"head":{"localX":3.486,"localY":-39.848},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":5.229,"localY":59.772},"hand_l":{"localX":45.315,"localY":21.131},"fingers_l":{"localX":18.126,"localY":8.452},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":5.229,"localY":59.772},"hand_r":{"localX":46.985,"localY":17.101},"fingers_r":{"localX":18.794,"localY":6.84},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":2.617,"localY":74.954},"foot_l":{"localX":-7.317,"localY":69.617},"toe_l":{"localX":14.943,"localY":1.307},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":23.176,"localY":71.329},"foot_r":{"localX":-57.341,"localY":40.15},"toe_r":{"localX":14.095,"localY":5.13}}},{"time":59,"poseData":{"pelvis":{"localX":0,"localY":-136},"spine":{"localX":12.096,"localY":-48.515},"chest":{"localX":13.782,"localY":-48.063},"neck":{"localX":3.473,"localY":-19.696},"head":{"localX":4.181,"localY":-39.781},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":50.883,"localY":31.795},"hand_l":{"localX":45.315,"localY":-21.131},"fingers_l":{"localX":18.794,"localY":-6.84},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":-47.281,"localY":36.94},"hand_r":{"localX":4.358,"localY":49.81},"fingers_r":{"localX":1.743,"localY":19.924},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-50.185,"localY":55.736},"foot_l":{"localX":-63.442,"localY":29.583},"toe_l":{"localX":13.595,"localY":6.339},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":55.736,"localY":50.185},"foot_r":{"localX":21.631,"localY":66.574},"toe_r":{"localX":14.489,"localY":-3.882}}}],"easing":"linear","repoFrames":0},"Attack 1":{"frameRate":60,"loop":false,"keyframes":[{"time":0,"poseData":{"pelvis":{"localX":0,"localY":-144},"spine":{"localX":1.745,"localY":-49.97},"chest":{"localX":2.617,"localY":-49.931},"neck":{"localX":0.698,"localY":-19.988},"head":{"localX":1.396,"localY":-39.976},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-28.168,"localY":52.977},"hand_l":{"localX":28.679,"localY":40.958},"fingers_l":{"localX":10.0,"localY":17.321},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":36.94,"localY":47.281},"hand_r":{"localX":47.553,"localY":-15.451},"fingers_r":{"localX":19.563,"localY":-4.158},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-15.593,"localY":73.361},"foot_l":{"localX":-2.443,"localY":69.957},"toe_l":{"localX":15.0,"localY":0.0},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":15.593,"localY":73.361},"foot_r":{"localX":2.443,"localY":69.957},"toe_r":{"localX":15.0,"localY":0.0}}},{"time":12,"poseData":{"pelvis":{"localX":-4,"localY":-142},"spine":{"localX":-5.226,"localY":-49.726},"chest":{"localX":-6.959,"localY":-49.513},"neck":{"localX":-0.698,"localY":-19.988},"head":{"localX":1.396,"localY":-39.976},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-42.426,"localY":42.426},"hand_l":{"localX":4.358,"localY":49.81},"fingers_l":{"localX":1.743,"localY":19.924},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":25.357,"localY":-54.378},"hand_r":{"localX":-21.131,"localY":-45.315},"fingers_r":{"localX":-6.84,"localY":-18.794},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-28.095,"localY":69.539},"foot_l":{"localX":-7.317,"localY":69.617},"toe_l":{"localX":15.0,"localY":0.0},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":28.095,"localY":69.539},"foot_r":{"localX":6.101,"localY":69.734},"toe_r":{"localX":15.0,"localY":0.0}}},{"time":26,"poseData":{"pelvis":{"localX":8,"localY":-136},"spine":{"localX":15.451,"localY":-47.553},"chest":{"localX":18.73,"localY":-46.359},"neck":{"localX":4.158,"localY":-19.563},"head":{"localX":5.567,"localY":-39.611},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-50.883,"localY":31.795},"hand_l":{"localX":-17.101,"localY":46.985},"fingers_l":{"localX":-6.84,"localY":18.794},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":58.689,"localY":12.475},"hand_r":{"localX":49.513,"localY":6.959},"fingers_r":{"localX":19.924,"localY":1.743},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-39.744,"localY":63.604},"foot_l":{"localX":-18.117,"localY":67.615},"toe_l":{"localX":14.772,"localY":2.605},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":43.018,"localY":61.436},"foot_r":{"localX":9.742,"localY":69.319},"toe_r":{"localX":15.0,"localY":0.0}}},{"time":42,"poseData":{"pelvis":{"localX":6,"localY":-138},"spine":{"localX":12.941,"localY":-48.296},"chest":{"localX":15.451,"localY":-47.553},"neck":{"localX":3.473,"localY":-19.696},"head":{"localX":4.181,"localY":-39.781},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-44.589,"localY":40.148},"hand_l":{"localX":-4.358,"localY":49.81},"fingers_l":{"localX":-1.743,"localY":19.924},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":44.589,"localY":40.148},"hand_r":{"localX":40.958,"localY":28.679},"fingers_r":{"localX":17.321,"localY":10.0},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-31.696,"localY":67.973},"foot_l":{"localX":-9.742,"localY":69.319},"toe_l":{"localX":14.943,"localY":1.307},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":32.878,"localY":67.41},"foot_r":{"localX":4.883,"localY":69.829},"toe_r":{"localX":15.0,"localY":0.0}}},{"time":59,"poseData":{"pelvis":{"localX":0,"localY":-144},"spine":{"localX":1.745,"localY":-49.97},"chest":{"localX":2.617,"localY":-49.931},"neck":{"localX":0.698,"localY":-19.988},"head":{"localX":1.396,"localY":-39.976},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-28.168,"localY":52.977},"hand_l":{"localX":28.679,"localY":40.958},"fingers_l":{"localX":10.0,"localY":17.321},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":36.94,"localY":47.281},"hand_r":{"localX":47.553,"localY":-15.451},"fingers_r":{"localX":19.563,"localY":-4.158},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-15.593,"localY":73.361},"foot_l":{"localX":-2.443,"localY":69.957},"toe_l":{"localX":15.0,"localY":0.0},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":15.593,"localY":73.361},"foot_r":{"localX":2.443,"localY":69.957},"toe_r":{"localX":15.0,"localY":0.0}}}],"easing":"ease-out","repoFrames":0},"Jump":{"frameRate":30,"loop":true,"keyframes":[{"time":0,"poseData":{"pelvis":{"localX":0,"localY":-152},"spine":{"localX":6.959,"localY":-49.513},"chest":{"localX":8.682,"localY":-49.24},"neck":{"localX":2.091,"localY":-19.89},"head":{"localX":3.486,"localY":-39.848},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-42.426,"localY":42.426},"hand_l":{"localX":4.358,"localY":49.81},"fingers_l":{"localX":1.743,"localY":19.924},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":54.378,"localY":-25.357},"hand_r":{"localX":28.679,"localY":-40.958},"fingers_r":{"localX":12.856,"localY":-15.321},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-31.696,"localY":67.973},"foot_l":{"localX":-57.341,"localY":40.15},"toe_l":{"localX":13.595,"localY":6.339},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":53.033,"localY":53.033},"foot_r":{"localX":-32.863,"localY":61.806},"toe_r":{"localX":14.489,"localY":3.882}}},{"time":30,"poseData":{"pelvis":{"localX":0,"localY":-148},"spine":{"localX":5.226,"localY":-49.726},"chest":{"localX":6.959,"localY":-49.513},"neck":{"localX":1.743,"localY":-19.924},"head":{"localX":2.79,"localY":-39.903},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-34.415,"localY":49.149},"hand_l":{"localX":12.941,"localY":48.296},"fingers_l":{"localX":5.176,"localY":19.319},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":57.956,"localY":15.529},"hand_r":{"localX":45.315,"localY":-21.131},"fingers_r":{"localX":18.794,"localY":-6.84},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-19.411,"localY":72.444},"foot_l":{"localX":-44.995,"localY":53.623},"toe_l":{"localX":14.095,"localY":5.13},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":39.744,"localY":63.604},"foot_r":{"localX":-18.117,"localY":67.615},"toe_r":{"localX":14.772,"localY":2.605}}},{"time":59,"poseData":{"pelvis":{"localX":0,"localY":-152},"spine":{"localX":6.959,"localY":-49.513},"chest":{"localX":8.682,"localY":-49.24},"neck":{"localX":2.091,"localY":-19.89},"head":{"localX":3.486,"localY":-39.848},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":-42.426,"localY":42.426},"hand_l":{"localX":4.358,"localY":49.81},"fingers_l":{"localX":1.743,"localY":19.924},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":54.378,"localY":-25.357},"hand_r":{"localX":28.679,"localY":-40.958},"fingers_r":{"localX":12.856,"localY":-15.321},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-31.696,"localY":67.973},"foot_l":{"localX":-57.341,"localY":40.15},"toe_l":{"localX":13.595,"localY":6.339},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":53.033,"localY":53.033},"foot_r":{"localX":-32.863,"localY":61.806},"toe_r":{"localX":14.489,"localY":3.882}}}],"easing":"ease-in-out","repoFrames":0},"Defend 1":{"frameRate":30,"loop":true,"keyframes":[{"time":0,"poseData":{"pelvis":{"localX":-3,"localY":-138},"spine":{"localX":3.488,"localY":-49.878},"chest":{"localX":4.358,"localY":-49.81},"neck":{"localX":1.395,"localY":-19.951},"head":{"localX":2.79,"localY":-39.903},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":42.426,"localY":42.426},"hand_l":{"localX":35.355,"localY":-35.355},"fingers_l":{"localX":14.142,"localY":-14.142},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":49.149,"localY":34.415},"hand_r":{"localX":21.131,"localY":-45.315},"fingers_r":{"localX":10.0,"localY":-17.321},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-28.095,"localY":69.539},"foot_l":{"localX":-6.101,"localY":69.734},"toe_l":{"localX":15.0,"localY":0.0},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":28.095,"localY":69.539},"foot_r":{"localX":2.443,"localY":69.957},"toe_r":{"localX":15.0,"localY":0.0}}},{"time":59,"poseData":{"pelvis":{"localX":-3,"localY":-138},"spine":{"localX":3.488,"localY":-49.878},"chest":{"localX":4.358,"localY":-49.81},"neck":{"localX":1.395,"localY":-19.951},"head":{"localX":2.79,"localY":-39.903},"shoulder_l":{"localX":-10,"localY":0},"elbow_l":{"localX":42.426,"localY":42.426},"hand_l":{"localX":35.355,"localY":-35.355},"fingers_l":{"localX":14.142,"localY":-14.142},"shoulder_r":{"localX":10,"localY":0},"elbow_r":{"localX":49.149,"localY":34.415},"hand_r":{"localX":21.131,"localY":-45.315},"fingers_r":{"localX":10.0,"localY":-17.321},"hip_l":{"localX":-5,"localY":0},"knee_l":{"localX":-28.095,"localY":69.539},"foot_l":{"localX":-6.101,"localY":69.734},"toe_l":{"localX":15.0,"localY":0.0},"hip_r":{"localX":5,"localY":0},"knee_r":{"localX":28.095,"localY":69.539},"foot_r":{"localX":2.443,"localY":69.957},"toe_r":{"localX":15.0,"localY":0.0}}}],"easing":"linear","repoFrames":0}}};

/**
 * CharaGen Runtime Character Engine for HeroMaker
 * Loads and animates CharaGen v2.0 character profiles (.json) with
 * forward kinematics (FK), procedural flesh/skin rendering, bone-anchored
 * accessories, and dynamic equipment color/tier overrides.
 */
class CharaGenCharacter {
    constructor() {
        this.joints = new Map();
        this.connections = new Map();
        this.anchors = [];
        this.equipment = new Map();
        this.inventory = new Map();
        this.profiles = new Map();

        this.skinState = {
            active: true,
            materialColor: '#f4c29f'
        };

        this.currentProfileName = 'Idle 1';
        this.currentProfile = null;
        this.currentFrame = 0;
        this.fps = 30;
        this.timeAccumulator = 0;
        this.isPlaying = true;
        this.playbackSpeed = 1.0;
        this.loaded = false;
        this.profileName = 'HeroMaker_Vanguard';

        // Visual overrides synced from HeroMaker weapon/armor upgrades
        this.tierVisuals = {
            weaponColor: '#deb887',
            weaponLevel: 1,
            armorColor: '#f0e68c',
            armorLevel: 1,
            buffAtk: false
        };

        if (typeof DEFAULT_HERO_CHARAGEN_PROFILE !== 'undefined') {
            this.loadFromJSON(DEFAULT_HERO_CHARAGEN_PROFILE);
        }
    }

    async loadFromUrl(url) {
        try {
            const res = await fetch(url, { cache: 'no-store' });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const text = await res.text();
            this.loadFromJSON(text);
            return true;
        } catch (err) {
            console.warn('CharaGenCharacter: Failed to load profile URL:', err);
            return false;
        }
    }

    loadFromJSON(jsonInput) {
        const data = typeof jsonInput === 'string' ? JSON.parse(jsonInput) : jsonInput;
        this.profileName = data.name || 'Custom_Hero';

        this.joints.clear();
        this.connections.clear();
        this.anchors = [];
        this.equipment.clear();
        this.profiles.clear();

        if (data.skinState) {
            this.skinState.active = data.skinState.active !== false;
            this.skinState.materialColor = data.skinState.materialColor || '#f4c29f';
        }

        if (data.graph) {
            if (Array.isArray(data.graph.joints)) {
                data.graph.joints.forEach(j => {
                    this.joints.set(j.id, {
                        id: j.id,
                        label: j.label || j.id,
                        x: j.x || 0,
                        y: j.y || 0,
                        radius: j.radius || 10,
                        parentId: null,
                        localX: j.x || 0,
                        localY: j.y || 0
                    });
                });
            }
            if (Array.isArray(data.graph.connections)) {
                data.graph.connections.forEach(c => {
                    this.connections.set(c.id, {
                        id: c.id,
                        label: c.label || c.id,
                        jointA: c.jointA,
                        jointB: c.jointB
                    });
                    const jA = this.joints.get(c.jointA);
                    const jB = this.joints.get(c.jointB);
                    if (jA && jB) {
                        jB.parentId = c.jointA;
                        jB.localX = jB.x - jA.x;
                        jB.localY = jB.y - jA.y;
                    }
                });
            }
        }

        // Load embedded inventory items
        if (data.inventory) {
            for (const [category, items] of Object.entries(data.inventory)) {
                if (!this.inventory.has(category)) {
                    this.inventory.set(category, []);
                }
                const list = this.inventory.get(category);
                items.forEach(item => {
                    if (!list.some(existing => existing.id === item.id)) {
                        list.push({ ...item });
                    }
                });
            }
        }

        // Also check browser localStorage for CharaGen studio library items if on same origin
        try {
            const savedLib = localStorage.getItem('charagen_accessory_library');
            if (savedLib) {
                const parsed = JSON.parse(savedLib);
                for (const [category, items] of Object.entries(parsed)) {
                    if (!this.inventory.has(category)) this.inventory.set(category, []);
                    const list = this.inventory.get(category);
                    items.forEach(item => {
                        if (!list.some(existing => existing.id === item.id)) {
                            list.push({ ...item });
                        }
                    });
                }
            }
        } catch {
            // Ignore storage access errors
        }

        this.anchors = Array.isArray(data.anchorPoints) ? data.anchorPoints.map(a => ({ ...a })) : [];

        if (data.equipmentSlots) {
            for (const [slotType, eq] of Object.entries(data.equipmentSlots)) {
                this.equipSlotItem(slotType, eq.itemId, eq.itemClass, eq.assetUri, eq.pivotX, eq.pivotY);
            }
        }

        if (data.movementProfiles) {
            for (const [name, prof] of Object.entries(data.movementProfiles)) {
                this.profiles.set(name, {
                    name,
                    frameRate: prof.frameRate || 30,
                    loop: prof.loop !== false,
                    keyframes: Array.isArray(prof.keyframes) ? prof.keyframes : [],
                    easing: prof.easing || 'linear',
                    repoFrames: prof.repoFrames || 0
                });
            }
        }

        // Pick initial idle profile
        const idleKey = this.findMatchingProfileName(['Idle 1', 'defaultIdle', 'Idle']) || Array.from(this.profiles.keys())[0];
        if (idleKey) {
            this.setProfile(idleKey, true);
        }

        this.updateWorldPositions();
        this.loaded = true;
    }

    findLibraryItem(itemId) {
        for (const items of this.inventory.values()) {
            const found = items.find(i => i.id === itemId);
            if (found) return found;
        }
        return null;
    }

    equipSlotItem(slotType, itemId, itemClass, directAssetUri = null, directPivotX = undefined, directPivotY = undefined) {
        const libItem = this.findLibraryItem(itemId);
        const assetUri = directAssetUri || (libItem ? libItem.assetUri : null);
        const pivotX = directPivotX !== undefined ? directPivotX : (libItem && libItem.pivotX !== undefined ? libItem.pivotX : 0.5);
        const pivotY = directPivotY !== undefined ? directPivotY : (libItem && libItem.pivotY !== undefined ? libItem.pivotY : 0.5);

        const eqObj = {
            itemId,
            itemClass: itemClass || slotType,
            assetUri,
            pivotX,
            pivotY,
            image: null
        };
        this.equipment.set(slotType, eqObj);

        if (assetUri) {
            const img = new Image();
            img.onload = () => {
                eqObj.image = img;
            };
            img.src = assetUri;
        }
    }

    /**
     * Generates dynamic SVG sprites or applies custom forged item art for all 5 CharaGen slots
     * (mainWeapon, headwear, topBody, legs, feet) so equipping any wardrobe piece updates the Hero live!
     */
    syncLoadout(loadout, buffAtk = false) {
        if (!loadout) return;

        const weapon = loadout.mainWeapon || (typeof Items !== 'undefined' ? Items.Weapons[0] : null);
        const headwear = loadout.headwear || (typeof Items !== 'undefined' ? Items.Headwear[0] : null);
        const topBody = loadout.topBody || (typeof Items !== 'undefined' ? Items.Armor[0] : null);
        const legs = loadout.legs || (typeof Items !== 'undefined' ? Items.Legs[0] : null);
        const feet = loadout.feet || (typeof Items !== 'undefined' ? Items.Feet[0] : null);

        const wColor = buffAtk ? '#f97316' : ((weapon && weapon.color) || '#deb887');
        const wLevel = (weapon && weapon.level) || 1;
        const aColor = (topBody && topBody.color) || '#f0e68c';
        const aLevel = (topBody && topBody.level) || 1;

        this.tierVisuals = {
            weaponColor: wColor,
            weaponLevel: wLevel,
            armorColor: aColor,
            armorLevel: aLevel,
            buffAtk
        };

        // 1. Main Weapon Slot ('mainWeapon')
        if (weapon) {
            if (weapon.assetUri) {
                this.equipSlotItem('mainWeapon', weapon.id, 'mainWeapon', weapon.assetUri, weapon.pivotX ?? 0.5, weapon.pivotY ?? 0.85);
            } else {
                const bladeLength = 96 + wLevel * 6;
                const bladeWidth = 14 + wLevel * 1.5;
                const guardWidth = 28 + wLevel * 3;
                const glowStroke = wLevel >= 4 || buffAtk ? '#fef08a' : '#451a03';
                const encWColor = encodeURIComponent(wColor);
                const encGlow = encodeURIComponent(glowStroke);

                const weaponSvg = `data:image/svg+xml;utf8,<svg width='56' height='165' xmlns='http://www.w3.org/2000/svg'>` +
                    `<polygon points='28,${122 - bladeLength} ${28 + bladeWidth / 2},28 ${28 + bladeWidth / 2 - 2},122 ${28 - bladeWidth / 2 + 2},122 ${28 - bladeWidth / 2},28' fill='${encWColor}' stroke='${encGlow}' stroke-width='2.5'/>` +
                    `<line x1='28' y1='${128 - bladeLength}' x2='28' y2='118' stroke='%23ffffff' stroke-opacity='0.65' stroke-width='2'/>` +
                    `<rect x='${28 - guardWidth / 2}' y='120' width='${guardWidth}' height='10' rx='3' fill='%23f59e0b' stroke='%2378350f' stroke-width='2'/>` +
                    `<rect x='24' y='130' width='8' height='22' rx='2' fill='%2378350f'/>` +
                    `<circle cx='28' cy='155' r='5.5' fill='%23fbbf24' stroke='%2378350f' stroke-width='1.5'/>` +
                    `</svg>`;
                this.equipSlotItem('mainWeapon', weapon.id, 'mainWeapon', weaponSvg, 0.5, 0.85);
            }
        }

        // 2. Top Body / Chest Armor Slot ('topBody')
        if (topBody) {
            if (topBody.assetUri) {
                this.equipSlotItem('topBody', topBody.id, 'topBody', topBody.assetUri, topBody.pivotX ?? 0.5, topBody.pivotY ?? 0.45);
            } else {
                const encAColor = encodeURIComponent(aColor);
                const trimColor = aLevel >= 4 ? '%23fbbf24' : '%23451a03';
                const tunicSvg = `data:image/svg+xml;utf8,<svg width='76' height='110' xmlns='http://www.w3.org/2000/svg'>` +
                    `<rect x='12' y='8' width='52' height='92' rx='14' fill='${encAColor}' stroke='${trimColor}' stroke-width='3'/>` +
                    (aLevel >= 3 ? `<path d='M22,20 L54,20 L48,58 L28,58 Z' fill='%23ffffff' fill-opacity='0.22'/>` : '') +
                    `<rect x='10' y='64' width='56' height='12' rx='3' fill='%23451a03'/>` +
                    `<rect x='32' y='62' width='12' height='16' rx='2' fill='%23fbbf24'/>` +
                    `</svg>`;
                this.equipSlotItem('topBody', topBody.id, 'topBody', tunicSvg, 0.5, 0.45);
            }
        }

        // 3. Headwear / Helmet Slot ('headwear')
        if (headwear) {
            if (headwear.assetUri) {
                this.equipSlotItem('headwear', headwear.id, 'headwear', headwear.assetUri, headwear.pivotX ?? 0.5, headwear.pivotY ?? 0.65);
            } else {
                const hLevel = headwear.level || 1;
                const encHColor = encodeURIComponent(headwear.color || '#f59e0b');
                const hTrim = hLevel >= 4 ? '%23fbbf24' : '%23451a03';
                let headSvg;
                if (hLevel <= 2) {
                    headSvg = `data:image/svg+xml;utf8,<svg width='70' height='60' xmlns='http://www.w3.org/2000/svg'>` +
                        `<path d='M10,38 Q35,6 60,38 Z' fill='${encHColor}' stroke='${hTrim}' stroke-width='3'/>` +
                        `<rect x='8' y='34' width='54' height='9' rx='4' fill='%2378350f'/>` +
                        `<circle cx='48' cy='26' r='4' fill='%23fef08a'/>` +
                        `</svg>`;
                } else {
                    const plumeColor = hLevel === 5 ? '%23fde047' : '%23ef4444';
                    headSvg = `data:image/svg+xml;utf8,<svg width='76' height='68' xmlns='http://www.w3.org/2000/svg'>` +
                        `<path d='M16,16 Q38,-2 58,18 L48,26 L22,24 Z' fill='${plumeColor}'/>` +
                        `<path d='M12,48 Q12,12 38,12 Q64,12 64,48 Z' fill='${encHColor}' stroke='${hTrim}' stroke-width='3'/>` +
                        `<rect x='36' y='28' width='26' height='10' rx='3' fill='%230f172a' stroke='${hTrim}' stroke-width='1.5'/>` +
                        `</svg>`;
                }
                this.equipSlotItem('headwear', headwear.id, 'headwear', headSvg, 0.5, 0.65);
            }
        }

        // 4. Leg Greaves Slot ('legs')
        if (legs) {
            if (legs.assetUri) {
                this.equipSlotItem('legs', legs.id, 'legs', legs.assetUri, legs.pivotX ?? 0.5, legs.pivotY ?? 0.5);
            } else {
                const lLevel = legs.level || 1;
                const encLColor = encodeURIComponent(legs.color || '#78350f');
                const lTrim = lLevel >= 4 ? '%23fbbf24' : '%23451a03';
                const greavesSvg = `data:image/svg+xml;utf8,<svg width='44' height='78' xmlns='http://www.w3.org/2000/svg'>` +
                    `<rect x='8' y='4' width='28' height='68' rx='8' fill='${encLColor}' stroke='${lTrim}' stroke-width='2.5'/>` +
                    (lLevel >= 3 ? `<rect x='6' y='8' width='32' height='12' rx='4' fill='%23f8fafc' fill-opacity='0.3'/>` : '') +
                    `</svg>`;
                this.equipSlotItem('legs', legs.id, 'legs', greavesSvg, 0.5, 0.5);
            }
        }

        // 5. Boots / Footwear Slot ('feet')
        if (feet) {
            if (feet.assetUri) {
                this.equipSlotItem('feet', feet.id, 'feet', feet.assetUri, feet.pivotX ?? 0.35, feet.pivotY ?? 0.5);
            } else {
                const fLevel = feet.level || 1;
                const encFColor = encodeURIComponent(feet.color || '#451a03');
                const fTrim = fLevel >= 4 ? '%23fbbf24' : '%2327272a';
                const wingMarkup = fLevel >= 4
                    ? `<path d='M8,14 L-2,4 L12,8 Z' fill='%23fde047'/>`
                    : '';
                const bootsSvg = `data:image/svg+xml;utf8,<svg width='56' height='38' xmlns='http://www.w3.org/2000/svg'>` +
                    wingMarkup +
                    `<path d='M8,6 L32,6 L48,24 L48,33 L8,33 Z' fill='${encFColor}' stroke='${fTrim}' stroke-width='2.5'/>` +
                    `<rect x='8' y='28' width='40' height='5' rx='2' fill='%2318181b'/>` +
                    `</svg>`;
                this.equipSlotItem('feet', feet.id, 'feet', bootsSvg, 0.35, 0.5);
            }
        }
    }

    syncEquipmentFromGameItems(weapon, armor, buffAtk = false) {
        this.syncLoadout({
            mainWeapon: weapon,
            topBody: armor,
            headwear: Items.Headwear ? Items.Headwear[Math.min((armor?.level || 1) - 1, Items.Headwear.length - 1)] : null,
            legs: Items.Legs ? Items.Legs[Math.min((armor?.level || 1) - 1, Items.Legs.length - 1)] : null,
            feet: Items.Feet ? Items.Feet[0] : null
        }, buffAtk);
    }

    findMatchingProfileName(candidates) {
        for (const name of candidates) {
            if (this.profiles.has(name)) {
                const p = this.profiles.get(name);
                if (p && p.keyframes && p.keyframes.length > 0) return name;
            }
        }
        for (const name of candidates) {
            if (this.profiles.has(name)) return name;
        }
        return null;
    }

    setProfile(name, forceReset = false) {
        if (!this.profiles.has(name)) return false;
        if (this.currentProfileName === name && !forceReset) return true;

        const prof = this.profiles.get(name);
        if (!prof || !prof.keyframes || prof.keyframes.length === 0) {
            // Fallback to a profile that actually has keyframes
            const fallback = this.findMatchingProfileName(['Idle 1', 'defaultIdle', 'Walk', 'Run']);
            if (fallback && fallback !== name) {
                return this.setProfile(fallback, forceReset);
            }
        }

        this.currentProfileName = name;
        this.currentProfile = prof;
        this.fps = prof.frameRate || 30;
        this.currentFrame = 0;
        this.timeAccumulator = 0;
        this.isPlaying = true;
        this.applyInterpolation();
        return true;
    }

    updateStateAnimation(dt, { isAttacking, isGrounded, vx, speedRatio = 1.0 }) {
        if (!this.loaded) return;

        let targetCandidates = ['Idle 1', 'defaultIdle'];
        this.playbackSpeed = 1.0;

        if (isAttacking) {
            targetCandidates = ['Attack 1', 'Idle 1', 'defaultIdle'];
            // Play 60-frame attack animation rapidly within the 0.24s attack window
            this.playbackSpeed = 3.8;
        } else if (!isGrounded) {
            targetCandidates = ['Jump', 'Run', 'Walk', 'Idle 1', 'defaultIdle'];
            this.playbackSpeed = 1.0;
        } else if (Math.abs(vx) > 15) {
            targetCandidates = ['Run', 'Walk', 'Idle 1', 'defaultIdle'];
            this.playbackSpeed = Math.max(0.85, Math.min(1.8, speedRatio * 1.25));
        }

        const chosen = this.findMatchingProfileName(targetCandidates);
        if (chosen && chosen !== this.currentProfileName) {
            this.setProfile(chosen, true);
        }

        this.updateTimeline(dt * 1000 * this.playbackSpeed);
    }

    updateAnimation(dtSeconds) {
        this.updateTimeline((dtSeconds || 0) * 1000 * (this.playbackSpeed || 1.0));
    }

    static generateItemSvgUri(item, buffAtk = false) {
        if (!item) return null;
        if (item.assetUri) return item.assetUri;
        const slot = item.slot || (item.damage !== undefined ? 'mainWeapon' : 'topBody');
        const level = item.level || 1;
        const color = item.color || '#deb887';

        if (slot === 'mainWeapon') {
            const wColor = buffAtk ? '#f97316' : color;
            const bladeLength = 96 + level * 6;
            const bladeWidth = 14 + level * 1.5;
            const guardWidth = 28 + level * 3;
            const glowStroke = level >= 4 || buffAtk ? '#fef08a' : '#451a03';
            const encWColor = encodeURIComponent(wColor);
            const encGlow = encodeURIComponent(glowStroke);
            return `data:image/svg+xml;utf8,<svg width='56' height='165' viewBox='0 0 56 165' xmlns='http://www.w3.org/2000/svg'>` +
                `<polygon points='28,${122 - bladeLength} ${28 + bladeWidth / 2},28 ${28 + bladeWidth / 2 - 2},122 ${28 - bladeWidth / 2 + 2},122 ${28 - bladeWidth / 2},28' fill='${encWColor}' stroke='${encGlow}' stroke-width='2.5'/>` +
                `<line x1='28' y1='${128 - bladeLength}' x2='28' y2='118' stroke='%23ffffff' stroke-opacity='0.65' stroke-width='2'/>` +
                `<rect x='${28 - guardWidth / 2}' y='120' width='${guardWidth}' height='10' rx='3' fill='%23f59e0b' stroke='%2378350f' stroke-width='2'/>` +
                `<rect x='24' y='130' width='8' height='22' rx='2' fill='%2378350f'/>` +
                `<circle cx='28' cy='155' r='5.5' fill='%23fbbf24' stroke='%2378350f' stroke-width='1.5'/>` +
                `</svg>`;
        } else if (slot === 'topBody') {
            const encAColor = encodeURIComponent(color);
            const trimColor = level >= 4 ? '%23fbbf24' : '%23451a03';
            return `data:image/svg+xml;utf8,<svg width='76' height='110' viewBox='0 0 76 110' xmlns='http://www.w3.org/2000/svg'>` +
                `<rect x='12' y='8' width='52' height='92' rx='14' fill='${encAColor}' stroke='${trimColor}' stroke-width='3'/>` +
                (level >= 3 ? `<path d='M22,20 L54,20 L48,58 L28,58 Z' fill='%23ffffff' fill-opacity='0.22'/>` : '') +
                `<rect x='10' y='64' width='56' height='12' rx='3' fill='%23451a03'/>` +
                `<rect x='32' y='62' width='12' height='16' rx='2' fill='%23fbbf24'/>` +
                `</svg>`;
        } else if (slot === 'headwear') {
            const encHColor = encodeURIComponent(color);
            const hTrim = level >= 4 ? '%23fbbf24' : '%23451a03';
            if (level <= 2) {
                return `data:image/svg+xml;utf8,<svg width='70' height='60' viewBox='0 0 70 60' xmlns='http://www.w3.org/2000/svg'>` +
                    `<path d='M10,38 Q35,6 60,38 Z' fill='${encHColor}' stroke='${hTrim}' stroke-width='3'/>` +
                    `<rect x='8' y='34' width='54' height='9' rx='4' fill='%2378350f'/>` +
                    `<circle cx='48' cy='26' r='4' fill='%23fef08a'/>` +
                    `</svg>`;
            }
            const plumeColor = level === 5 ? '%23fde047' : '%23ef4444';
            return `data:image/svg+xml;utf8,<svg width='76' height='68' viewBox='0 0 76 68' xmlns='http://www.w3.org/2000/svg'>` +
                `<path d='M16,16 Q38,-2 58,18 L48,26 L22,24 Z' fill='${plumeColor}'/>` +
                `<path d='M12,48 Q12,12 38,12 Q64,12 64,48 Z' fill='${encHColor}' stroke='${hTrim}' stroke-width='3'/>` +
                `<rect x='36' y='28' width='26' height='10' rx='3' fill='%230f172a' stroke='${hTrim}' stroke-width='1.5'/>` +
                `</svg>`;
        } else if (slot === 'legs') {
            const encLColor = encodeURIComponent(color);
            const lTrim = level >= 4 ? '%23fbbf24' : '%23451a03';
            return `data:image/svg+xml;utf8,<svg width='44' height='78' viewBox='0 0 44 78' xmlns='http://www.w3.org/2000/svg'>` +
                `<rect x='8' y='4' width='28' height='68' rx='8' fill='${encLColor}' stroke='${lTrim}' stroke-width='2.5'/>` +
                (level >= 3 ? `<rect x='6' y='8' width='32' height='12' rx='4' fill='%23f8fafc' fill-opacity='0.3'/>` : '') +
                `</svg>`;
        } else if (slot === 'feet') {
            const encFColor = encodeURIComponent(color);
            const fTrim = level >= 4 ? '%23fbbf24' : '%2327272a';
            const wingMarkup = level >= 4 ? `<path d='M8,14 L-2,4 L12,8 Z' fill='%23fde047'/>` : '';
            return `data:image/svg+xml;utf8,<svg width='56' height='38' viewBox='0 0 56 38' xmlns='http://www.w3.org/2000/svg'>` +
                wingMarkup +
                `<path d='M8,6 L32,6 L48,24 L48,33 L8,33 Z' fill='${encFColor}' stroke='${fTrim}' stroke-width='2.5'/>` +
                `<rect x='8' y='28' width='40' height='5' rx='2' fill='%2318181b'/>` +
                `</svg>`;
        }
        return null;
    }

    updateTimeline(deltaTimeMs) {
        if (!this.isPlaying || !this.currentProfile) return;
        const keyframes = this.currentProfile.keyframes;
        if (!keyframes || keyframes.length === 0) return;

        const frameTimeMs = 1000 / (this.fps || 30);
        this.timeAccumulator += deltaTimeMs;

        const lastKfTime = keyframes[keyframes.length - 1].time;
        const repo = this.currentProfile.repoFrames || 0;
        const maxFrames = Math.max(59, lastKfTime) + repo;

        // Advance smoothly (supports fractional frames for silky 60fps playback)
        const frameAdvance = this.timeAccumulator / frameTimeMs;
        this.timeAccumulator = 0;
        this.currentFrame += frameAdvance;

        if (this.currentFrame > maxFrames) {
            if (this.currentProfile.loop) {
                this.currentFrame = this.currentFrame % maxFrames;
            } else {
                this.currentFrame = maxFrames;
            }
        }

        this.applyInterpolation();
    }

    applyInterpolation() {
        if (!this.currentProfile) return;
        const keyframes = this.currentProfile.keyframes;
        if (!keyframes || keyframes.length === 0) return;

        const lastKfTime = keyframes[keyframes.length - 1].time;
        const repoFrames = this.currentProfile.repoFrames || 0;
        const baseLength = Math.max(59, lastKfTime);
        const maxFrames = baseLength + repoFrames;

        let timeFrame = Math.min(maxFrames, Math.max(0, this.currentFrame));
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
                if (timeFrame >= keyframes[i].time && timeFrame <= keyframes[i + 1].time) {
                    kfPrev = keyframes[i];
                    kfNext = keyframes[i + 1];
                    break;
                }
            }
        }

        if (kfPrev === kfNext || kfNext.time === kfPrev.time) {
            for (const joint of this.joints.values()) {
                const pd = kfPrev.poseData && kfPrev.poseData[joint.id];
                if (pd) {
                    if (pd.localX !== undefined) joint.localX = pd.localX;
                    if (pd.localY !== undefined) joint.localY = pd.localY;
                }
            }
        } else {
            let t = (timeFrame - kfPrev.time) / (kfNext.time - kfPrev.time);
            const easeType = this.currentProfile.easing || 'linear';
            if (easeType === 'ease-in-out') {
                t = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
            } else if (easeType === 'ease-out') {
                t = 1 - Math.pow(1 - t, 3);
            } else if (easeType === 'ease-in') {
                t = t * t * t;
            }

            for (const joint of this.joints.values()) {
                const pdPrev = kfPrev.poseData && kfPrev.poseData[joint.id];
                const pdNext = kfNext.poseData && kfNext.poseData[joint.id];

                if (pdPrev && pdNext) {
                    if (joint.parentId) {
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

        this.updateWorldPositions();
    }

    updateWorldPositions() {
        for (const joint of this.joints.values()) {
            if (!joint.parentId) {
                this.updateJointWorldPositionRecursive(joint);
            }
        }
    }

    updateJointWorldPositionRecursive(joint) {
        if (joint.parentId) {
            const parent = this.joints.get(joint.parentId);
            if (parent) {
                joint.x = parent.x + joint.localX;
                joint.y = parent.y + joint.localY;
            } else {
                joint.x = joint.localX;
                joint.y = joint.localY;
            }
        } else {
            joint.x = joint.localX;
            joint.y = joint.localY;
        }

        for (const child of this.joints.values()) {
            if (child.parentId === joint.id) {
                this.updateJointWorldPositionRecursive(child);
            }
        }
    }

    calculateAccessoryTransform(anchor, jointA, jointB) {
        if (!jointA || !jointB) return null;
        const pct = anchor.positionPercent !== undefined ? anchor.positionPercent : 0.5;
        const x = jointA.x + (jointB.x - jointA.x) * pct;
        const y = jointA.y + (jointB.y - jointA.y) * pct;
        const rotation = Math.atan2(jointB.y - jointA.y, jointB.x - jointA.x);

        return {
            x,
            y,
            rotation: rotation + (anchor.rotationOffset || 0),
            scaleX: anchor.scale || 1,
            scaleY: anchor.scale || 1
        };
    }

    drawLimbSegment(ctx, connId, fillStyle, strokeStyle = 'rgba(15, 23, 42, 0.55)') {
        const c = this.connections.get(connId);
        if (!c) return;
        const jA = this.joints.get(c.jointA);
        const jB = this.joints.get(c.jointB);
        if (!jA || !jB) return;

        const rA = jA.radius || 10;
        const rB = jB.radius || 10;
        const dx = jB.x - jA.x;
        const dy = jB.y - jA.y;
        const dist = Math.hypot(dx, dy);

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = strokeStyle;
        ctx.lineWidth = 3;

        if (dist > 0) {
            const angle = Math.atan2(dy, dx);
            const angleOffsetA = Math.acos(Math.max(-1, Math.min(1, (rA - rB) / dist)));

            const p1x = jA.x + rA * Math.cos(angle + angleOffsetA);
            const p1y = jA.y + rA * Math.sin(angle + angleOffsetA);
            const p2x = jB.x + rB * Math.cos(angle + angleOffsetA);
            const p2y = jB.y + rB * Math.sin(angle + angleOffsetA);
            const p3x = jB.x + rB * Math.cos(angle - angleOffsetA);
            const p3y = jB.y + rB * Math.sin(angle - angleOffsetA);
            const p4x = jA.x + rA * Math.cos(angle - angleOffsetA);
            const p4y = jA.y + rA * Math.sin(angle - angleOffsetA);

            ctx.beginPath();
            ctx.moveTo(p1x, p1y);
            ctx.lineTo(p2x, p2y);
            ctx.lineTo(p3x, p3y);
            ctx.lineTo(p4x, p4y);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }

        [jA, jB].forEach(j => {
            const r = j.radius || 10;
            ctx.beginPath();
            ctx.arc(j.x, j.y, r, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    drawAnchorsForConnection(ctx, connId) {
        for (const a of this.anchors) {
            if (a.connectionId !== connId) continue;
            const equip = this.equipment.get(a.slotType);
            if (!equip || !equip.image || !equip.image.complete || equip.image.naturalWidth === 0) continue;

            const conn = this.connections.get(a.connectionId);
            if (!conn) continue;
            const jA = this.joints.get(conn.jointA);
            const jB = this.joints.get(conn.jointB);
            const transform = this.calculateAccessoryTransform(a, jA, jB);
            if (!transform) continue;

            ctx.save();
            ctx.translate(transform.x, transform.y);
            ctx.rotate(transform.rotation);
            ctx.scale(transform.scaleX, transform.scaleY);
            const img = equip.image;
            const dx = -img.width * (equip.pivotX !== undefined ? equip.pivotX : 0.5);
            const dy = -img.height * (equip.pivotY !== undefined ? equip.pivotY : 0.5);
            ctx.drawImage(img, dx, dy);
            ctx.restore();
        }
    }

    /**
     * Renders the articulated CharaGen character at screen coordinates.
     * Foot floor (y=0 in CharaGen) aligns with (footCenterX, footBottomY).
     */
    draw(ctx, footCenterX, footBottomY, facing = 1, targetHeightPx = 76, isAttacking = false) {
        if (!this.loaded || this.joints.size === 0) return false;

        // Standard CharaGen humanoid is ~330 units tall (from y=0 to y=-330)
        const scale = targetHeightPx / 335;

        ctx.save();
        ctx.translate(footCenterX, footBottomY);
        ctx.scale(facing * scale, scale);

        const baseSkin = this.skinState.materialColor || '#f4c29f';
        const backLimbSkin = '#d69e78'; // Slightly shaded for depth on far-side limbs

        // Painter's Algorithm Depth Order for Side-On 2D Hero:
        // 1. Back (Left) Arm & Back (Left) Leg
        const backConnections = [
            'clavicle_l', 'arm_u_l', 'arm_l_l', 'fingers_conn_l',
            'pelvis_l', 'leg_u_l', 'leg_l_l', 'toe_conn_l'
        ];
        // 2. Core Torso, Neck & Head
        const coreConnections = [
            'pelvis_spine', 'spine_chest', 'chest_neck', 'neck_head'
        ];
        // 3. Front (Right) Leg & Front (Right) Sword Arm
        const frontConnections = [
            'pelvis_r', 'leg_u_r', 'leg_l_r', 'toe_conn_r',
            'clavicle_r', 'arm_u_r', 'arm_l_r', 'fingers_conn_r'
        ];

        const renderedConns = new Set();

        const renderLayer = (connList, skinColor) => {
            for (const cid of connList) {
                if (this.connections.has(cid)) {
                    renderedConns.add(cid);
                    if (this.skinState.active) {
                        this.drawLimbSegment(ctx, cid, skinColor);
                    }
                    this.drawAnchorsForConnection(ctx, cid);
                }
            }
        };

        renderLayer(backConnections, backLimbSkin);
        renderLayer(coreConnections, baseSkin);

        // Draw eyes / heroic expression on Head joint before headwear
        const headJoint = this.joints.get('head');
        if (headJoint && this.skinState.active) {
            ctx.save();
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(headJoint.x + 11, headJoint.y - 3, 3.8, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        renderLayer(frontConnections, baseSkin);

        // Render any custom connections not in the standard humanoid list
        for (const cid of this.connections.keys()) {
            if (!renderedConns.has(cid)) {
                if (this.skinState.active) {
                    this.drawLimbSegment(ctx, cid, baseSkin);
                }
                this.drawAnchorsForConnection(ctx, cid);
            }
        }

        // Dynamic Sword Slash Whoosh Arc during active attack
        if (isAttacking) {
            const handR = this.joints.get('hand_r') || this.joints.get('fingers_r');
            if (handR) {
                ctx.save();
                ctx.strokeStyle = this.tierVisuals.buffAtk ? 'rgba(249, 115, 22, 0.85)' : 'rgba(254, 240, 138, 0.8)';
                ctx.lineWidth = 14;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(0, -190, 165, -Math.PI * 0.42, Math.PI * 0.22);
                ctx.stroke();
                ctx.restore();
            }
        }

        ctx.restore();
        return true;
    }
}
