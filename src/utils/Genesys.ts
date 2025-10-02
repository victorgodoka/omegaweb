export const getCardGenesysPoints = (cardName: string): number => {
  const cardEntry = CARDLISTPOINTS.find(entry =>
    entry.card.toLowerCase() === cardName.toLowerCase()
  );
  return cardEntry?.points || 0;
};

export const CARDLISTPOINTS = [
  {
    card: `Abyss Dweller`,
    points: 100
  },
  {
    card: `Adamancipator Risen - Dragite`,
    points: 20
  },
  {
    card: `Agido the Ancient Sentinel`,
    points: 50
  },
  {
    card: `Albion the Sanctifire Dragon`,
    points: 33
  },
  {
    card: `Allure of Darkness`,
    points: 5
  },
  {
    card: `Amorphactor Pain, the Imagination Dracoverlord`,
    points: 100
  },
  {
    card: `Ancient Gear Advance`,
    points: 33
  },
  {
    card: `Ancient Gear Statue`,
    points: 33
  },
  {
    card: `And the Band Played On`,
    points: 100
  },
  {
    card: `Angel O7`,
    points: 100
  },
  {
    card: `Anti-Spell Fragrance`,
    points: 100
  },
  {
    card: `Appointer of the Red Lotus`,
    points: 50
  },
  {
    card: `Arcana Force XXI - The World`,
    points: 100
  },
  {
    card: `Archlord Kristya`,
    points: 100
  },
  {
    card: `Archnemeses Eschatos`,
    points: 100
  },
  {
    card: `Archnemeses Protos`,
    points: 100
  },
  {
    card: `Artifact Scythe`,
    points: 100
  },
  {
    card: `Asceticism of the Six Samurai`,
    points: 10
  },
  {
    card: `Ash Blossom & Joyous Spring`,
    points: 15
  },
  {
    card: `Assault Synchron`,
    points: 5
  },
  {
    card: `Astral Kuriboh`,
    points: 3
  },
  {
    card: `Atlantean Dragoons`,
    points: 40
  },
  {
    card: `Azamina Ilia Silvia`,
    points: 20
  },
  {
    card: `Azamina Mu Rcielago`,
    points: 33
  },
  {
    card: `Bahamut Shark`,
    points: 81
  },
  {
    card: `Baronne de Fleur`,
    points: 85
  },
  {
    card: `Barrier of the Voiceless Voice`,
    points: 33
  },
  {
    card: `Barrier Statue of the Abyss`,
    points: 60
  },
  {
    card: `Barrier Statue of the Drought`,
    points: 60
  },
  {
    card: `Barrier Statue of the Heavens`,
    points: 60
  },
  {
    card: `Barrier Statue of the Inferno`,
    points: 60
  },
  {
    card: `Barrier Statue of the Stormwinds`,
    points: 60
  },
  {
    card: `Barrier Statue of the Torrent`,
    points: 60
  },
  {
    card: `Beatrice, Lady of the Eternal`,
    points: 100
  },
  {
    card: `Big Welcome Labrynth`,
    points: 33
  },
  {
    card: `Blackwing - Boreastorm the Wicked Wind`,
    points: 20
  },
  {
    card: `Blackwing - Zephyros the Elite`,
    points: 13
  },
  {
    card: `Blaster, Dragon Ruler of Infernos`,
    points: 7
  },
  {
    card: `Blaze Fenix, the Burning Bombardment Bird`,
    points: 70
  },
  {
    card: `Blazing Cartesia, the Virtuous`,
    points: 3
  },
  {
    card: `Block Dragon`,
    points: 33
  },
  {
    card: `Bonfire`,
    points: 33
  },
  {
    card: `Book of Eclipse`,
    points: 5
  },
  {
    card: `Book of Moon`,
    points: 7
  },
  {
    card: `Brain Research Lab`,
    points: 100
  },
  {
    card: `Branded Expulsion`,
    points: 33
  },
  {
    card: `Branded Fusion`,
    points: 33
  },
  {
    card: `Branded Lost`,
    points: 66
  },
  {
    card: `Brilliant Fusion`,
    points: 33
  },
  {
    card: `Butterfly Dagger - Elma`,
    points: 1
  },
  {
    card: `Bystial Baldrake`,
    points: 30
  },
  {
    card: `Bystial Dis Pater`,
    points: 10
  },
  {
    card: `Bystial Druiswurm`,
    points: 30
  },
  {
    card: `Bystial Magnamhut`,
    points: 33
  },
  {
    card: `Bystial Saronir`,
    points: 20
  },
  {
    card: `Called by the Grave`,
    points: 20
  },
  {
    card: `Card Destruction`,
    points: 40
  },
  {
    card: `Card of Demise`,
    points: 40
  },
  {
    card: `Card of Safe Return`,
    points: 40
  },
  {
    card: `Catapult Turtle`,
    points: 100
  },
  {
    card: `Centur-Ion Auxila`,
    points: 33
  },
  {
    card: `Centur-Ion Primera`,
    points: 5
  },
  {
    card: `Centur-Ion Trudea`,
    points: 3
  },
  {
    card: `Chain Strike`,
    points: 50
  },
  {
    card: `Change of Heart`,
    points: 10
  },
  {
    card: `Chaofeng, Phantom of the Yang Zing`,
    points: 13
  },
  {
    card: `Chaos Angel`,
    points: 20
  },
  {
    card: `Chaos Dragon Levianeer`,
    points: 10
  },
  {
    card: `Chaos Ruler, the Chaotic Magical Dragon`,
    points: 50
  },
  {
    card: `Chaos Space`,
    points: 40
  },
  {
    card: `Charge of the Light Brigade`,
    points: 33
  },
  {
    card: `Chicken Game`,
    points: 7
  },
  {
    card: `Cold Wave`,
    points: 100
  },
  {
    card: `Confiscation`,
    points: 100
  },
  {
    card: `Contact "C"`,
    points: 100
  },
  {
    card: `Cornfield Coatl`,
    points: 33
  },
  {
    card: `Cosmic Blazar Dragon`,
    points: 1
  },
  {
    card: `Creature Swap`,
    points: 1
  },
  {
    card: `Crimson Dragon`,
    points: 100
  },
  {
    card: `Crossout Designator`,
    points: 10
  },
  {
    card: `Crystron Inclusion`,
    points: 33
  },
  {
    card: `Crystron Smiger`,
    points: 5
  },
  {
    card: `Crystron Sulfador`,
    points: 3
  },
  {
    card: `Crystron Thystvern`,
    points: 5
  },
  {
    card: `Cyber Angel Benten`,
    points: 40
  },
  {
    card: `Cyber Dragon Infinity`,
    points: 20
  },
  {
    card: `Cyber Jar`,
    points: 33
  },
  {
    card: `Cyber-Stein`,
    points: 27
  },
  {
    card: `D/D/D Duo-Dawn King Kali Yuga`,
    points: 77
  },
  {
    card: `D/D/D Wave High King Caesar`,
    points: 20
  },
  {
    card: `Daigusto Emeral`,
    points: 1
  },
  {
    card: `Danger! Bigfoot!`,
    points: 3
  },
  {
    card: `Danger! Chupacabra!`,
    points: 3
  },
  {
    card: `Danger! Dogman!`,
    points: 3
  },
  {
    card: `Danger! Mothman!`,
    points: 3
  },
  {
    card: `Danger! Nessie!`,
    points: 7
  },
  {
    card: `Danger! Ogopogo!`,
    points: 3
  },
  {
    card: `Danger! Thunderbird!`,
    points: 3
  },
  {
    card: `Danger!? Jackalope?`,
    points: 7
  },
  {
    card: `Danger!? Tsuchinoko?`,
    points: 7
  },
  {
    card: `Dark End Evaporation Dragon`,
    points: 5
  },
  {
    card: `Dark Hole`,
    points: 3
  },
  {
    card: `Dark World Archives`,
    points: 5
  },
  {
    card: `Dark World Dealings`,
    points: 5
  },
  {
    card: `Deception of the Sinful Spoils`,
    points: 33
  },
  {
    card: `Deck Lockdown`,
    points: 100
  },
  {
    card: `Deep Sea Aria`,
    points: 33
  },
  {
    card: `Delinquent Duo`,
    points: 100
  },
  {
    card: `Demise of the Land`,
    points: 1
  },
  {
    card: `Denglong, First of the Yang Zing`,
    points: 33
  },
  {
    card: `Denko Sekka`,
    points: 20
  },
  {
    card: `Destiny HERO - Destroyer Phoenix Enforcer`,
    points: 20
  },
  {
    card: `Destiny HERO - Plasma`,
    points: 20
  },
  {
    card: `Destructive Daruma Karma Cannon`,
    points: 5
  },
  {
    card: `Diabell, Queen of the White Forest`,
    points: 25
  },
  {
    card: `Diabellstar the Black Witch`,
    points: 20
  },
  {
    card: `Different Dimension Ground`,
    points: 10
  },
  {
    card: `Dimension Fusion`,
    points: 45
  },
  {
    card: `Dimension Shifter`,
    points: 10
  },
  {
    card: `Dimensional Barrier`,
    points: 100
  },
  {
    card: `Dinomorphia Intact`,
    points: 1
  },
  {
    card: `Dinomorphia Rexterm`,
    points: 91
  },
  {
    card: `Dinowrestler Pankratops`,
    points: 10
  },
  {
    card: `Divine Arsenal AA-ZEUS - Sky Thunder`,
    points: 20
  },
  {
    card: `Diviner of the Herald`,
    points: 33
  },
  {
    card: `Djinn Releaser of Rituals`,
    points: 100
  },
  {
    card: `Dogmatika Ecclesia, the Virtuous`,
    points: 3
  },
  {
    card: `Domain of the True Monarchs`,
    points: 50
  },
  {
    card: `Dominus Impulse`,
    points: 30
  },
  {
    card: `Dominus Purge`,
    points: 10
  },
  {
    card: `Dominus Spiral`,
    points: 10
  },
  {
    card: `Dracotail Arthalion`,
    points: 20
  },
  {
    card: `Dracotail Faimena`,
    points: 20
  },
  {
    card: `Dracotail Mululu`,
    points: 5
  },
  {
    card: `Dragon Master Magia`,
    points: 100
  },
  {
    card: `Dragonic Diagram`,
    points: 33
  },
  {
    card: `Dragonmaid Sheou`,
    points: 20
  },
  {
    card: `Dragonmaid Tidying`,
    points: 10
  },
  {
    card: `Dragon's Bind`,
    points: 100
  },
  {
    card: `Dragon's Light and Darkness`,
    points: 7
  },
  {
    card: `Droll & Lock Bird`,
    points: 5
  },
  {
    card: `Drytron Alpha Thuban`,
    points: 33
  },
  {
    card: `Drytron Mu Beta Fafnir`,
    points: 33
  },
  {
    card: `Duality`,
    points: 10
  },
  {
    card: `Eclipse Wyvern`,
    points: 33
  },
  {
    card: `Effect Veiler`,
    points: 7
  },
  {
    card: `El Shaddoll Apkallone`,
    points: 10
  },
  {
    card: `El Shaddoll Winda`,
    points: 60
  },
  {
    card: `Elder Entity Norden`,
    points: 91
  },
  {
    card: `Elder Entity N'tss`,
    points: 7
  },
  {
    card: `Elemental HERO Stratos`,
    points: 3
  },
  {
    card: `Elzette, Azamina of the White Forest`,
    points: 22
  },
  {
    card: `Emergency Teleport`,
    points: 40
  },
  {
    card: `EMERGENCY!`,
    points: 33
  },
  {
    card: `Eva`,
    points: 1
  },
  {
    card: `Evenly Matched`,
    points: 10
  },
  {
    card: `Evilswarm Ouroboros`,
    points: 67
  },
  {
    card: `Ext Ryzeal`,
    points: 25
  },
  {
    card: `F.A. Dawn Dragster`,
    points: 20
  },
  {
    card: `Fairy Tail - Snow`,
    points: 85
  },
  {
    card: `Fiber Jar`,
    points: 30
  },
  {
    card: `Final Countdown`,
    points: 100
  },
  {
    card: `Fire Formation - Tenki`,
    points: 40
  },
  {
    card: `Fire King Courtier Ulcanix`,
    points: 20
  },
  {
    card: `Fire King High Avatar Kirin`,
    points: 10
  },
  {
    card: `Fishborg Blaster`,
    points: 33
  },
  {
    card: `Floowandereeze & Robina`,
    points: 33
  },
  {
    card: `Floowandereeze and the Advent of Adventure`,
    points: 33
  },
  {
    card: `Floowandereeze and the Magnificent Map`,
    points: 33
  },
  {
    card: `Foolish Burial`,
    points: 33
  },
  {
    card: `Foolish Burial Goods`,
    points: 3
  },
  {
    card: `Forbidden Chalice`,
    points: 5
  },
  {
    card: `Forbidden Droplet`,
    points: 10
  },
  {
    card: `Forbidden Lance`,
    points: 3
  },
  {
    card: `Fossil Dig`,
    points: 40
  },
  {
    card: `Fossil Dyna Pachycephalo`,
    points: 100
  },
  {
    card: `Frightfur Patchwork`,
    points: 33
  },
  {
    card: `Fusion Destiny`,
    points: 33
  },
  {
    card: `Gallant Granite`,
    points: 33
  },
  {
    card: `Gateway of the Six`,
    points: 100
  },
  {
    card: `Gem-Knight Master Diamond`,
    points: 66
  },
  {
    card: `Ghost Belle & Haunted Mansion`,
    points: 5
  },
  {
    card: `Ghost Meets Girl - A Masterful Mayakashi Shiranui Saga`,
    points: 100
  },
  {
    card: `Ghost Mourner & Moonlit Chill`,
    points: 7
  },
  {
    card: `Ghost Ogre & Snow Rabbit`,
    points: 5
  },
  {
    card: `Ghost Sister & Spooky Dogwood`,
    points: 3
  },
  {
    card: `Giant Trunade`,
    points: 40
  },
  {
    card: `Gigantic Spright`,
    points: 20
  },
  {
    card: `Gimmick Puppet Nightmare`,
    points: 70
  },
  {
    card: `Give and Take`,
    points: 91
  },
  {
    card: `Gladiator Beast Gyzarus`,
    points: 20
  },
  {
    card: `Gladiator Beast Tamer Editor`,
    points: 20
  },
  {
    card: `Gladiator Proving Ground`,
    points: 33
  },
  {
    card: `Gladiator Rejection`,
    points: 15
  },
  {
    card: `Glow-Up Bulb`,
    points: 21
  },
  {
    card: `Goblin Biker Grand Entrance`,
    points: 33
  },
  {
    card: `Gold Sarcophagus`,
    points: 10
  },
  {
    card: `Gozen Match`,
    points: 100
  },
  {
    card: `Graceful Charity`,
    points: 40
  },
  {
    card: `Grapha, Dragon Lord of Dark World`,
    points: 5
  },
  {
    card: `Grapha, Dragon Overlord of Dark World`,
    points: 5
  },
  {
    card: `Gruesome Grave Squirmer`,
    points: 1
  },
  {
    card: `Guardian Chimera`,
    points: 33
  },
  {
    card: `Guiding Quem, the Virtuous`,
    points: 3
  },
  {
    card: `Harpie's Feather Duster`,
    points: 30
  },
  {
    card: `Harpie's Feather Storm`,
    points: 100
  },
  {
    card: `Heart of the Blue-Eyes`,
    points: 5
  },
  {
    card: `Heat Wave`,
    points: 100
  },
  {
    card: `Heavy Storm`,
    points: 20
  },
  {
    card: `Herald of the Arc Light`,
    points: 50
  },
  {
    card: `Hot Red Dragon Archfiend King Calamity`,
    points: 1
  },
  {
    card: `Hyper Rank-Up-Magic Utopiforce`,
    points: 1
  },
  {
    card: `Ice Ryzeal`,
    points: 20
  },
  {
    card: `Ido the Supreme Magical Force`,
    points: 100
  },
  {
    card: `Imperial Order`,
    points: 100
  },
  {
    card: `Imsety, Glory of Horus`,
    points: 33
  },
  {
    card: `Incoming Machine!`,
    points: 33
  },
  {
    card: `Incredible Ecclesia, the Virtuous`,
    points: 3
  },
  {
    card: `Infernal Flame Banshee`,
    points: 33
  },
  {
    card: `Infernity Launcher`,
    points: 88
  },
  {
    card: `Infinite Impermanence`,
    points: 13
  },
  {
    card: `Inspector Boarder`,
    points: 20
  },
  {
    card: `Instant Fusion`,
    points: 100
  },
  {
    card: `Interrupted Kaiju Slumber`,
    points: 33
  },
  {
    card: `Into the Void`,
    points: 3
  },
  {
    card: `Invoked Caliga`,
    points: 90
  },
  {
    card: `Jet Synchron`,
    points: 1
  },
  {
    card: `Jowgen the Spiritualist`,
    points: 100
  },
  {
    card: `Junk Speeder`,
    points: 100
  },
  {
    card: `K9-04 Noroi`,
    points: 10
  },
  {
    card: `K9-17 "Ripper"`,
    points: 20
  },
  {
    card: `K9-17 Izuna`,
    points: 20
  },
  {
    card: `K9-66a Jokul`,
    points: 13
  },
  {
    card: `K9-ØØ Lupis`,
    points: 5
  },
  {
    card: `Kaiser Colosseum`,
    points: 100
  },
  {
    card: `Kashtira Arise-Heart`,
    points: 97
  },
  {
    card: `Kashtira Fenrir`,
    points: 30
  },
  {
    card: `Kashtira Unicorn`,
    points: 30
  },
  {
    card: `Kelbek the Ancient Vanguard`,
    points: 50
  },
  {
    card: `Keldo the Sacred Protector`,
    points: 1
  },
  {
    card: `Ketu Dracotail`,
    points: 10
  },
  {
    card: `King of the Feral Imps`,
    points: 33
  },
  {
    card: `King's Sarcophagus`,
    points: 33
  },
  {
    card: `Knight Armed Dragon, the Armored Knight Dragon`,
    points: 3
  },
  {
    card: `Knightmare Corruptor Iblee`,
    points: 100
  },
  {
    card: `Koa'ki Meiru Drago`,
    points: 75
  },
  {
    card: `Koa'ki Meiru Guardian`,
    points: 3
  },
  {
    card: `Koa'ki Meiru Overload`,
    points: 3
  },
  {
    card: `Koa'ki Meiru Sandman`,
    points: 3
  },
  {
    card: `Koa'ki Meiru Wall`,
    points: 3
  },
  {
    card: `Lady Labrynth of the Silver Castle`,
    points: 33
  },
  {
    card: `Lady's Dragonmaid`,
    points: 20
  },
  {
    card: `Last Turn`,
    points: 75
  },
  {
    card: `Last Will`,
    points: 100
  },
  {
    card: `Lavalval Chain`,
    points: 80
  },
  {
    card: `Left Arm Offering`,
    points: 7
  },
  {
    card: `Legendary Fire King Ponix`,
    points: 10
  },
  {
    card: `Legendary Lord Six Samurai - Shi En`,
    points: 10
  },
  {
    card: `Legendary Six Samurai - Shi En`,
    points: 10
  },
  {
    card: `Level Eater`,
    points: 100
  },
  {
    card: `Life Equalizer`,
    points: 100
  },
  {
    card: `Light and Darkness Dragonlord`,
    points: 20
  },
  {
    card: `Light Barrier`,
    points: 1
  },
  {
    card: `Light End Sublimation Dragon`,
    points: 5
  },
  {
    card: `Lightning Storm`,
    points: 40
  },
  {
    card: `Lightsworn Dragonling`,
    points: 10
  },
  {
    card: `Lonefire Blossom`,
    points: 33
  },
  {
    card: `Lose 1 Turn`,
    points: 100
  },
  {
    card: `Lubellion the Searing Dragon`,
    points: 33
  },
  {
    card: `Lyrilusc - Beryl Canary`,
    points: 5
  },
  {
    card: `Lyrilusc - Bird Call`,
    points: 20
  },
  {
    card: `Lyrilusc - Independent Nightingale`,
    points: 1
  },
  {
    card: `Magical Explosion`,
    points: 75
  },
  {
    card: `Magical Mid-Breaker Field`,
    points: 60
  },
  {
    card: `Magical Scientist`,
    points: 95
  },
  {
    card: `Magician of Black Chaos MAX`,
    points: 100
  },
  {
    card: `Majesty's Fiend`,
    points: 100
  },
  {
    card: `Mansion of the Dreadful Dolls`,
    points: 100
  },
  {
    card: `Masked HERO Dark Law`,
    points: 70
  },
  {
    card: `Mass Driver`,
    points: 100
  },
  {
    card: `Master Peace, the True Dracoslaying King`,
    points: 33
  },
  {
    card: `Mathmech Sigma`,
    points: 7
  },
  {
    card: `Maxx "C"`,
    points: 50
  },
  {
    card: `Meizen the Battle Ninja`,
    points: 20
  },
  {
    card: `Mementomictlan Tecuhtlica - Creation King`,
    points: 33
  },
  {
    card: `Mementotlan Bone Party`,
    points: 33
  },
  {
    card: `Mementotlan Twin Dragon`,
    points: 33
  },
  {
    card: `Metamorphosis`,
    points: 10
  },
  {
    card: `Metaverse`,
    points: 3
  },
  {
    card: `Mikanko Water Arabesque`,
    points: 10
  },
  {
    card: `Millennium Ankh`,
    points: 3
  },
  {
    card: `Mind Drain`,
    points: 100
  },
  {
    card: `Mind Master`,
    points: 1
  },
  {
    card: `Mirage of Nightmare`,
    points: 10
  },
  {
    card: `Mirrorjade the Iceblade Dragon`,
    points: 33
  },
  {
    card: `Miscellaneousaurus`,
    points: 75
  },
  {
    card: `Mistake`,
    points: 100
  },
  {
    card: `Mitsurugi Prayers`,
    points: 60
  },
  {
    card: `Mitsurugi Ritual`,
    points: 60
  },
  {
    card: `Monster Gate`,
    points: 50
  },
  {
    card: `Monster Reborn`,
    points: 15
  },
  {
    card: `Morphing Jar`,
    points: 33
  },
  {
    card: `Morphtronic Telefon`,
    points: 55
  },
  {
    card: `Moulinglacia the Elemental Lord`,
    points: 100
  },
  {
    card: `Mudora the Sword Oracle`,
    points: 1
  },
  {
    card: `Mulcharmy Fuwalos`,
    points: 7
  },
  {
    card: `Mulcharmy Meowls`,
    points: 3
  },
  {
    card: `Mulcharmy Purulia`,
    points: 10
  },
  {
    card: `Multi-Universe`,
    points: 3
  },
  {
    card: `M-X-Saber Invoker`,
    points: 33
  },
  {
    card: `Mystic Mine`,
    points: 100
  },
  {
    card: `Nadir Servant`,
    points: 33
  },
  {
    card: `Naturia Barkion`,
    points: 10
  },
  {
    card: `Naturia Beast`,
    points: 50
  },
  {
    card: `Naturia Exterio`,
    points: 100
  },
  {
    card: `Necrovalley`,
    points: 40
  },
  {
    card: `Neptabyss, the Atlantean Prince`,
    points: 33
  },
  {
    card: `Nibiru, the Primal Being`,
    points: 10
  },
  {
    card: `Nightmare Apprentice`,
    points: 33
  },
  {
    card: `Nightmare Throne`,
    points: 50
  },
  {
    card: `Number 1: Infection Buzzking`,
    points: 85
  },
  {
    card: `Number 1: Numeron Gate Ekam`,
    points: 10
  },
  {
    card: `Number 100: Numeron Dragon`,
    points: 1
  },
  {
    card: `Number 16: Shock Master`,
    points: 100
  },
  {
    card: `Number 2: Numeron Gate Dve`,
    points: 10
  },
  {
    card: `Number 3: Numeron Gate Trini`,
    points: 10
  },
  {
    card: `Number 38: Hope Harbinger Dragon Titanic Galaxy`,
    points: 20
  },
  {
    card: `Number 4: Numeron Gate Catvari`,
    points: 10
  },
  {
    card: `Number 40: Gimmick Puppet of Strings`,
    points: 50
  },
  {
    card: `Number 41: Bagooska the Terribly Tired Tapir`,
    points: 100
  },
  {
    card: `Number 43: Manipulator of Souls`,
    points: 100
  },
  {
    card: `Number 59: Crooked Cook`,
    points: 100
  },
  {
    card: `Number 60: Dugares the Timeless`,
    points: 10
  },
  {
    card: `Number 67: Pair-a-Dice Smasher`,
    points: 67
  },
  {
    card: `Number 75: Bamboozling Gossip Shadow`,
    points: 70
  },
  {
    card: `Number 86: Heroic Champion - Rhongomyniad`,
    points: 31
  },
  {
    card: `Number 89: Diablosis the Mind Hacker`,
    points: 85
  },
  {
    card: `Number 90: Galaxy-Eyes Photon Lord`,
    points: 10
  },
  {
    card: `Number 95: Galaxy-Eyes Dark Matter Dragon`,
    points: 50
  },
  {
    card: `Number 97: Draglubion`,
    points: 100
  },
  {
    card: `Number C1: Numeron Chaos Gate Sunya`,
    points: 10
  },
  {
    card: `Number C40: Gimmick Puppet of Dark Strings`,
    points: 50
  },
  {
    card: `Number F0: Utopic Draco Future`,
    points: 20
  },
  {
    card: `Number S0: Utopic ZEXAL`,
    points: 100
  },
  {
    card: `Numbers Eveil`,
    points: 70
  },
  {
    card: `Numeron Calling`,
    points: 30
  },
  {
    card: `Numeron Network`,
    points: 33
  },
  {
    card: `Obedience Schooled`,
    points: 40
  },
  {
    card: `Ohime the Manifested Mikanko`,
    points: 33
  },
  {
    card: `Ojama Duo`,
    points: 2
  },
  {
    card: `Ojama Trio`,
    points: 3
  },
  {
    card: `One Day of Peace`,
    points: 11
  },
  {
    card: `One for One`,
    points: 91
  },
  {
    card: `Onomatopaira`,
    points: 33
  },
  {
    card: `Original Sinful Spoils - Snake-Eye`,
    points: 100
  },
  {
    card: `Outer Entity Azathot`,
    points: 100
  },
  {
    card: `Painful Choice`,
    points: 95
  },
  {
    card: `Phantom Knights' Rank-Up-Magic Force`,
    points: 1
  },
  {
    card: `Phantom of Yubel`,
    points: 50
  },
  {
    card: `Pilgrim Reaper`,
    points: 50
  },
  {
    card: `Planet Pathfinder`,
    points: 2
  },
  {
    card: `Pot of Desires`,
    points: 20
  },
  {
    card: `Pot of Greed`,
    points: 30
  },
  {
    card: `Pot of Prosperity`,
    points: 40
  },
  {
    card: `Powersink Stone`,
    points: 100
  },
  {
    card: `Premature Burial`,
    points: 25
  },
  {
    card: `Preparation of Rites`,
    points: 5
  },
  {
    card: `Pre-Preparation of Rites`,
    points: 10
  },
  {
    card: `Pressured Planet Wraitsoth`,
    points: 33
  },
  {
    card: `Primeval Planet Perlereino`,
    points: 50
  },
  {
    card: `Primite Lordly Lode`,
    points: 33
  },
  {
    card: `Prohibition`,
    points: 100
  },
  {
    card: `Pseudo Space`,
    points: 3
  },
  {
    card: `Psi-Blocker`,
    points: 61
  },
  {
    card: `Psychic End Punisher`,
    points: 20
  },
  {
    card: `PSY-Framegear Delta`,
    points: 7
  },
  {
    card: `PSY-Framegear Epsilon`,
    points: 7
  },
  {
    card: `PSY-Framegear Gamma`,
    points: 15
  },
  {
    card: `PSY-Framelord Omega`,
    points: 100
  },
  {
    card: `Purrely`,
    points: 15
  },
  {
    card: `Purrely Sleepy Memory`,
    points: 15
  },
  {
    card: `Purrelyly`,
    points: 10
  },
  {
    card: `Quick Launch`,
    points: 33
  },
  {
    card: `Raidraptor - Vanishing Lanius`,
    points: 5
  },
  {
    card: `Raigeki`,
    points: 7
  },
  {
    card: `Rank-Up-Magic - The Seventh One`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Admiration of the Thousands`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Argent Chaos Force`,
    points: 5
  },
  {
    card: `Rank-Up-Magic Astral Force`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Barian's Force`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Cipher Ascension`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Doom Double Force`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Limited Barian's Force`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Magical Force`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Numeron Force`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Quick Chaos`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Raid Force`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Raptor's Force`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Revolution Force`,
    points: 1
  },
  {
    card: `Rank-Up-Magic Skip Force`,
    points: 5
  },
  {
    card: `Rank-Up-Magic Soul Shave Force`,
    points: 5
  },
  {
    card: `Rank-Up-Magic Zexal Force`,
    points: 1
  },
  {
    card: `Ra's Disciple`,
    points: 1
  },
  {
    card: `Reasoning`,
    points: 50
  },
  {
    card: `Red Reboot`,
    points: 50
  },
  {
    card: `Red-Eyes Dark Dragoon`,
    points: 100
  },
  {
    card: `Redox, Dragon Ruler of Boulders`,
    points: 7
  },
  {
    card: `Regenesis`,
    points: 33
  },
  {
    card: `Reinforcement of the Army`,
    points: 40
  },
  {
    card: `Rescue-ACE Air Lifter`,
    points: 10
  },
  {
    card: `Rescue-ACE Preventer`,
    points: 10
  },
  {
    card: `Return from the Different Dimension`,
    points: 50
  },
  {
    card: `Return of the Dragon Lords`,
    points: 7
  },
  {
    card: `Rise Rank-Up-Magic Raidraptor's Force`,
    points: 1
  },
  {
    card: `Rite of Aramesir`,
    points: 5
  },
  {
    card: `Ritual Beast Tamer Elder`,
    points: 10
  },
  {
    card: `Rivalry of Warlords`,
    points: 100
  },
  {
    card: `Ronintoadin`,
    points: 60
  },
  {
    card: `Royal Decree`,
    points: 10
  },
  {
    card: `Royal Magical Library`,
    points: 100
  },
  {
    card: `Royal Oppression`,
    points: 100
  },
  {
    card: `Ryzeal Detonator`,
    points: 20
  },
  {
    card: `Ryzeal Duo Drive`,
    points: 20
  },
  {
    card: `Sales Ban`,
    points: 100
  },
  {
    card: `Sangen Kaimen`,
    points: 50
  },
  {
    card: `Sangen Summoning`,
    points: 100
  },
  {
    card: `Sauravis, the Ancient and Ascended`,
    points: 5
  },
  {
    card: `Schwarzschild Infinity Dragon`,
    points: 33
  },
  {
    card: `Secret Village of the Spellcasters`,
    points: 100
  },
  {
    card: `Self-Destruct Button`,
    points: 100
  },
  {
    card: `Sengenjin Wakes from a Millennium`,
    points: 33
  },
  {
    card: `Set Rotation`,
    points: 33
  },
  {
    card: `Shaddoll Schism`,
    points: 10
  },
  {
    card: `Shien's Dojo`,
    points: 10
  },
  {
    card: `Shien's Smoke Signal`,
    points: 33
  },
  {
    card: `Shooting Riser Dragon`,
    points: 33
  },
  {
    card: `Sillva, Warlord of Dark World`,
    points: 100
  },
  {
    card: `Sixth Sense`,
    points: 65
  },
  {
    card: `Skill Drain`,
    points: 100
  },
  {
    card: `Smoke Grenade of the Thief`,
    points: 87
  },
  {
    card: `Snake-Eye Ash`,
    points: 5
  },
  {
    card: `Snake-Eyes Poplar`,
    points: 5
  },
  {
    card: `Snatch Steal`,
    points: 7
  },
  {
    card: `Snoww, Unlight of Dark World`,
    points: 33
  },
  {
    card: `Solemn Judgment`,
    points: 7
  },
  {
    card: `Solemn Strike`,
    points: 5
  },
  {
    card: `Solemn Warning`,
    points: 5
  },
  {
    card: `Songs of the Dominators`,
    points: 10
  },
  {
    card: `Soul Charge`,
    points: 50
  },
  {
    card: `Soul Drain`,
    points: 100
  },
  {
    card: `Speedroid Terrortop`,
    points: 3
  },
  {
    card: `Spell Canceller`,
    points: 20
  },
  {
    card: `Spiritual Beast Tamer Lara`,
    points: 10
  },
  {
    card: `Spright Starter`,
    points: 20
  },
  {
    card: `Stand Up Centur-Ion!`,
    points: 5
  },
  {
    card: `Star Seraph Scepter`,
    points: 5
  },
  {
    card: `Star Seraph Sovereignty`,
    points: 5
  },
  {
    card: `Stardust Sifr Divine Dragon`,
    points: 1
  },
  {
    card: `Starliege Seyfert`,
    points: 33
  },
  {
    card: `Stray Purrely Street`,
    points: 5
  },
  {
    card: `Substitoad`,
    points: 60
  },
  {
    card: `Subterror Guru`,
    points: 5
  },
  {
    card: `Summon Limit`,
    points: 100
  },
  {
    card: `Super Polymerization`,
    points: 10
  },
  {
    card: `Super Starslayer TY-PHON - Sky Crisis`,
    points: 10
  },
  {
    card: `Supreme King Dragon Starving Venom`,
    points: 1
  },
  {
    card: `Swap Frog`,
    points: 33
  },
  {
    card: `Sword Ryzeal`,
    points: 20
  },
  {
    card: `Swordsoul Emergence`,
    points: 33
  },
  {
    card: `Swordsoul Grandmaster - Chixiao`,
    points: 33
  },
  {
    card: `Swordsoul of Mo Ye`,
    points: 3
  },
  {
    card: `Swordsoul Strategist Longyuan`,
    points: 5
  },
  {
    card: `T.G. Hyper Librarian`,
    points: 33
  },
  {
    card: `Tearlaments Havnis`,
    points: 50
  },
  {
    card: `Tearlaments Kitkallos`,
    points: 50
  },
  {
    card: `Tearlaments Merrli`,
    points: 50
  },
  {
    card: `Tearlaments Reinoheart`,
    points: 50
  },
  {
    card: `Tearlaments Scheiren`,
    points: 50
  },
  {
    card: `Telekinetic Charging Cell`,
    points: 100
  },
  {
    card: `Tellarknight Ptolemaeus`,
    points: 100
  },
  {
    card: `Tempest, Dragon Ruler of Storms`,
    points: 7
  },
  {
    card: `Tenpai Dragon Chundra`,
    points: 50
  },
  {
    card: `Tenpai Dragon Genroku`,
    points: 25
  },
  {
    card: `Tenyi Spirit - Ashuna`,
    points: 33
  },
  {
    card: `Terraforming`,
    points: 33
  },
  {
    card: `That Grass Looks Greener`,
    points: 50
  },
  {
    card: `The Black Goat Laughs`,
    points: 10
  },
  {
    card: `The Bystial Lubellion`,
    points: 30
  },
  {
    card: `The Forceful Sentry`,
    points: 100
  },
  {
    card: `The Gates of Dark World`,
    points: 5
  },
  {
    card: `The Hidden City`,
    points: 33
  },
  {
    card: `The Last Warrior from Another Planet`,
    points: 100
  },
  {
    card: `The Melody of Awakening Dragon`,
    points: 33
  },
  {
    card: `The Monarchs Erupt`,
    points: 50
  },
  {
    card: `The Phantom Knights' Rank-Up-Magic Launch`,
    points: 1
  },
  {
    card: `The Tyrant Neptune`,
    points: 100
  },
  {
    card: `The Unstoppable Exodia Incarnate`,
    points: 20
  },
  {
    card: `The Zombie Vampire`,
    points: 50
  },
  {
    card: `There Can Be Only One`,
    points: 100
  },
  {
    card: `Thunder Dragon Colossus`,
    points: 67
  },
  {
    card: `Thunder King Rai-Oh`,
    points: 20
  },
  {
    card: `Tidal, Dragon Ruler of Waterfalls`,
    points: 7
  },
  {
    card: `Toadally Awesome`,
    points: 20
  },
  {
    card: `Tour Guide From the Underworld`,
    points: 3
  },
  {
    card: `Transaction Rollback`,
    points: 7
  },
  {
    card: `Trap Dustshoot`,
    points: 94
  },
  {
    card: `Trap Holic`,
    points: 7
  },
  {
    card: `Traptrix Rafflesia`,
    points: 10
  },
  {
    card: `Triple Tactics Talent`,
    points: 93
  },
  {
    card: `Triple Tactics Thrust`,
    points: 13
  },
  {
    card: `Trishula, Dragon of the Ice Barrier`,
    points: 3
  },
  {
    card: `True King of All Calamities`,
    points: 100
  },
  {
    card: `Tyrant's Tirade`,
    points: 100
  },
  {
    card: `Ultimaya Tzolkin`,
    points: 100
  },
  {
    card: `Union Hangar`,
    points: 33
  },
  {
    card: `Vanity's Emptiness`,
    points: 100
  },
  {
    card: `Vanity's Fiend`,
    points: 100
  },
  {
    card: `Vanity's Ruler`,
    points: 100
  },
  {
    card: `Vanquish Soul Hollie Sue`,
    points: 10
  },
  {
    card: `Varudras, the Final Bringer of the End Times`,
    points: 20
  },
  {
    card: `Virtual World Kyubi - Shenshen`,
    points: 20
  },
  {
    card: `Virtual World Mai-Hime - Lulu`,
    points: 3
  },
  {
    card: `Wandering Gryphon Rider`,
    points: 20
  },
  {
    card: `WANTED: Seeker of Sinful Spoils`,
    points: 33
  },
  {
    card: `Water Enchantress of the Temple`,
    points: 5
  },
  {
    card: `Welcome Labrynth`,
    points: 33
  },
  {
    card: `Wind-Up Carrier Zenmaity`,
    points: 33
  },
  {
    card: `Wind-Up Hunter`,
    points: 75
  },
  {
    card: `Wishes for Eyes of Blue`,
    points: 33
  },
  {
    card: `Witch of the White Forest`,
    points: 33
  },
  {
    card: `Yaguramaru the Armor Ninja`,
    points: 20
  },
  {
    card: `Zaborg the Mega Monarch`,
    points: 80
  },
  {
    card: `Zoodiac Barrage`,
    points: 33
  },
  {
    card: `Zoodiac Broadbull`,
    points: 66
  },
  {
    card: `Zoodiac Drident`,
    points: 20
  },
  {
    card: `Zoodiac Ratpier`,
    points: 50
  },
]
