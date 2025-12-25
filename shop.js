// Shop system

class Shop {
    constructor() {
        this.weaponTiers = [
            { name: 'Rusty Sword', damage: 10, cost: 0, owned: true },
            { name: 'Iron Sword', damage: 15, cost: 50 },
            { name: 'Steel Sword', damage: 22, cost: 150 },
            { name: 'Mithril Sword', damage: 32, cost: 400 },
            { name: 'Dragon Blade', damage: 45, cost: 1000 }
        ];
        
        this.armorTiers = [
            { name: 'Cloth Armor', defense: 0, cost: 0, owned: true },
            { name: 'Leather Armor', defense: 2, cost: 40 },
            { name: 'Chainmail', defense: 5, cost: 120 },
            { name: 'Plate Armor', defense: 10, cost: 350 },
            { name: 'Dragon Scale', defense: 18, cost: 900 }
        ];
        
        this.currentWeaponTier = 0;
        this.currentArmorTier = 0;
    }

    getAvailableWeapons() {
        return this.weaponTiers.filter((tier, index) => index > this.currentWeaponTier);
    }

    getAvailableArmor() {
        return this.armorTiers.filter((tier, index) => index > this.currentArmorTier);
    }

    buyWeapon(tierIndex, player) {
        if (tierIndex <= this.currentWeaponTier) return false;
        
        const tier = this.weaponTiers[tierIndex];
        if (player.gold >= tier.cost) {
            player.gold -= tier.cost;
            this.currentWeaponTier = tierIndex;
            player.damage = tier.damage;
            return true;
        }
        return false;
    }

    buyArmor(tierIndex, player) {
        if (tierIndex <= this.currentArmorTier) return false;
        
        const tier = this.armorTiers[tierIndex];
        if (player.gold >= tier.cost) {
            player.gold -= tier.cost;
            this.currentArmorTier = tierIndex;
            player.defense = tier.defense;
            return true;
        }
        return false;
    }

    getCurrentWeapon() {
        return this.weaponTiers[this.currentWeaponTier];
    }

    getCurrentArmor() {
        return this.armorTiers[this.currentArmorTier];
    }
}

