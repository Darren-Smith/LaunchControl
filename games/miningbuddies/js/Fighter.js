import { Miner } from './Miner.js';

/**
 * Fighter is now Miner 2 (Cyan Helmet), equipped with the same pickaxe/drill
 * so both players can crack diamond boulders AND fight Goblin Rock Monsters!
 */
export class Fighter extends Miner {
    constructor(game) {
        super(game, {
            id: 2,
            name: 'Miner 2',
            x: 820,
            y: 350,
            color: '#38bdf8',
            hpBarId: 'miner2-health-fill',
            hpTextId: 'miner2-hp-text'
        });
    }
}
