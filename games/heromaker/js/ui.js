class UI {
    constructor(game) {
        this.game = game;

        this.weaponName = document.getElementById('weapon-name');
        this.armorName = document.getElementById('armor-name');
        this.shopList = document.getElementById('shop-list');

        if (this.shopList) this.initShop();
    }

    initShop() {
        if (!this.shopList) return;
        // Clear list
        this.shopList.innerHTML = '';

        const createCategory = (title, items) => {
            const header = document.createElement('h3');
            header.textContent = title;
            this.shopList.appendChild(header);

            items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'shop-item';
                div.innerHTML = `
                    <span class="item-name" style="color:${item.color}">${item.name}</span>
                    <span class="item-stats">
                        ${item.damage ? `Dmg: ${item.damage}` : ''}
                        ${item.defense ? `Def: ${item.defense}` : ''}
                        ${item.health ? `HP: ${item.health}` : ''}
                    </span>
                    <button class="buy-btn" data-id="${item.id}" data-cost="${item.cost}">
                        ${item.cost === 0 ? 'Equip' : 'Buy: ' + item.cost}
                    </button>
                `;
                this.shopList.appendChild(div);

                div.querySelector('button').addEventListener('click', () => {
                    this.tryBuyOrEquip(item);
                });
            });
        };

        createCategory('Weapons', Items.Weapons);
        createCategory('Armor', Items.Armor);
    }

    tryBuyOrEquip(item) {
        const player = this.game.player;
        // Ideally we track owned items. For this prototype, cost 0 = owned/free.
        // Or we check if player has coins. 
        // For simplicity: If cost > 0, check coins. If bought, cost becomes 0 (owned).

        if (item.cost <= player.coins) {
            if (item.cost > 0) {
                player.coins -= item.cost;
                item.cost = 0; // Mark as owned
                this.initShop(); // Re-render to show "Equip"
            }
            player.equip(item);
            this.updateHeroMaker();
        } else {
            alert("Not enough coins!");
        }
    }

    updateHeroMaker() {
        const player = this.game.player;
        if (this.weaponName) this.weaponName.textContent = player.weapon.name;
        if (this.armorName) this.armorName.textContent = player.armor.name;
    }

    update() {
        if (!this.game || !this.game.player) return;
        const player = this.game.player;

        const hpElem = document.getElementById('hp-display');
        if (hpElem) hpElem.textContent = Math.floor(player.hp) + '/' + player.maxHp;

        const coinElem = document.getElementById('coin-display');
        if (coinElem) coinElem.textContent = player.coins;
    }
}
