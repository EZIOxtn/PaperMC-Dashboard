import { useEffect, useState, useRef, Suspense, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ApiClient } from "../utils/api";
import { parsePlayerDataFromRaw } from "../utils/jsonParser";
import  CommandModal  from "./CommandModal";
import {ReactSkinview3d}  from "react-skinview3d";
import { FiSearch, FiMapPin } from "react-icons/fi";
import ConfirmRemove from "./dialogRem";
import { FaBed } from "react-icons/fa";

import { string } from "three/tsl";
import { SkinViewer, WalkingAnimation, RunningAnimation, FlyingAnimation, IdleAnimation, WaveAnimation,CrouchAnimation,  HitAnimation } from "skinview3d";
type AnimationName =
  | "None"
  | "Idle"
  | "Walk"
  | "Run"
  | "Fly"
  | "Wave"
  | "Crouch"
  | "Hit";

// 2️⃣ Strongly typed animation factory table
const animations: Record<AnimationName, () => any> = {
  None: () => new IdleAnimation(),
  Idle: () => new IdleAnimation(),
  Walk: () => new WalkingAnimation(),
  Run: () => new RunningAnimation(),
  Fly: () => new FlyingAnimation(),
  Wave: () => new WaveAnimation(),
  Crouch: () => new CrouchAnimation(),
  Hit: () => new HitAnimation(),
};
type InvItem = { slot: number; id: string; count: number, durability: number, maxdurability: number, enchantments: any[] };
type enchantements = { id: string; lvl: number };
type coords = { x: number; y: number; z: number; world: string };
type bed_spawn = { world: string; x: number; y: number; z: number; set: boolean };
type location = { coords: coords, bed_spawn: bed_spawn };
type SkinViewerProps = {
  skinBase64: string;
  width?: number;
  height?: number;
};


type PlayerData = {
  name?: string;
  uuid?: string;
  skin?: string;
  health?: number | null;
  coorinates?: coords | null;
  bed_spawnx?: bed_spawn | null;
  maxHealth?: number;
  offhand?: string;
  total?: number;
  current?: number;
  offhmt?: number;
  offhanddurability?: number;
  offhandmaxdurability?: number;
  offhandenchantments?: enchantements[];
  ammountoffh?: number;
  hunger?: number | null;
  saturation?: number;
  maxHunger?: number;
  level?: number;
  experience?: number;
  inventory?: InvItem[];
  armor?: Array<{ slot: number; type: string; amount: number; enchantments?: enchantements[] }>;
  statistics?: Record<string, number>;
  advancements?: Record<string, any>;
  
};

// small image map for common items (fallbacks displayed as text)
const ITEM_IMAGE: Record<string, string> = {
  acacia_log: "https://gamepedia.cursecdn.com/minecraft_gamepedia/thumb/3/3a/Acacia_Log_JE7.png/120px-Acacia_Log_JE7.png",
  oak_log: "https://gamepedia.cursecdn.com/minecraft_gamepedia/thumb/c/c5/Oak_Log_Axis_Y_JE5_BE3.png/150px-Oak_Log_Axis_Y_JE5_BE3.png?version=be4f749b0035ee90956bab6c5361eeb5",
  cobblestone: "https://gamepedia.cursecdn.com/minecraft_gamepedia/thumb/6/6a/Cobblestone_JE6_BE3.png/150px-Cobblestone_JE6_BE3.png",
  wheat_seeds: "https://gamepedia.cursecdn.com/minecraft_gamepedia/thumb/6/6b/Wheat_Seeds_JE1.png/120px-Wheat_Seeds_JE1.png",
  acacia_sapling: "https://gamepedia.cursecdn.com/minecraft_gamepedia/thumb/4/46/Acacia_Sapling_JE1.png/120px-Acacia_Sapling_JE1.png",
  sand: "https://gamepedia.cursecdn.com/minecraft_gamepedia/thumb/8/80/Sand_JE2.png/120px-Sand_JE2.png",
};

// Load health/hunger bar icons
const heartIcon = new URL('../assets/heart.png', import.meta.url).href;
const halfhIcon = new URL('../assets/halfh.png', import.meta.url).href;

// Load local mc icon assets (eagerly) and build a map of name->url
const pngIcons = import.meta.glob('../assets/mcicon/*.png', {
  eager: true,
  as: 'url'
}) as Record<string, string>;

const gifIcons = import.meta.glob('../assets/mcicon/*.webp', {
  eager: true,
  as: 'url'
}) as Record<string, string>;

// Merge them into a single object
const _iconModules = { ...pngIcons, ...gifIcons };
const ICON_MAP: Record<string, string> = {};
Object.keys(_iconModules).forEach((p) => {
  const fname = p.split('/').pop() || p;
  const name = fname.replace(/\.[^/.]+$/, '').toLowerCase();
  ICON_MAP[name] = _iconModules[p];
});
const _gifArmor = import.meta.glob('../assets/ench_armor/*.gif',
  { eager: true,
  as: 'url'
}) as Record<string, string>;
const _webpArmor = import.meta.glob('../assets/ench_armor/*.webp',
  { eager: true,
  as: 'url'
}) as Record<string, string>;
const ICON_MAP_ARMOR: Record<string, string> = {};

// add webp first
Object.keys(_webpArmor).forEach(p => {
  const fname = p.split('/').pop()!;
  const name = fname.replace(/\.[^/.]+$/, '').toLowerCase();
  ICON_MAP_ARMOR[name] = _webpArmor[p];
});

// add gif next, overwrite webp if gif exists
Object.keys(_gifArmor).forEach(p => {
  const fname = p.split('/').pop()!;
  const name = fname.replace(/\.[^/.]+$/, '').toLowerCase();
  ICON_MAP_ARMOR[name] = _gifArmor[p];
});

async function handleTeleport(Player : string,x:number,y:number,z:number,Sset : boolean){
  if(Player && Sset){
    let res : any;
    console.log(Player,x,y,z,Sset)
    try{
     res = await ApiClient.tpPlayer(Player,x,y,z);
    if(res.success){
      console.log(JSON.parse(res));
      window.alert('player teleported to spawn');
    }else{
      console.error(JSON.stringify(res));
    }

    }catch(err){
      console.error(err);



    }



  }


}


function getItemImage(id: string | undefined, location: string = "notarmor") {
  if (!id) return undefined;
  // normalize id to match filenames: remove namespace, lowercase, replace separators
  let key = id.replace(/^minecraft:/, '').toLowerCase();
  key = key.replace(/[:\s\-]/g, '_');
  if (location === "armor") {
    key = "enchanted_"+  key;
    //console.log("Armor key:", key);
    //console.log("Armor icons:", ICON_MAP_ARMOR);
    if (ICON_MAP_ARMOR[key]){return ICON_MAP_ARMOR[key];}
    
  }
 // console.log(ICON_MAP);
  // direct match
  if (ICON_MAP[key]) return ICON_MAP[key];

  // try stripping suffixes like _item or _block
  const alt = key.replace(/_(item|block|ore|planks|log)s?$/, '');
  if (ICON_MAP[alt]) return ICON_MAP[alt];

  // fallback to built-in remote map
  return ITEM_IMAGE[key];
}

export default function PlayerDetails() {
  const width = 500;
  const height = 500;

  const { playerName } = useParams<{ playerName: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<PlayerData | null>(null);
  const [killdata, setkilldata] = useState<any>(null);
  const [raw, setRaw] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
const [isOpen, setIsOpen] = useState(false);
 const [success, setSuccess] = useState<string>("");
   const [selectedItem, setSelectedItem] = useState("ACACIA_LOG");
   const [confirmItem, setConfirmItem] = useState<string | "null">("null");
  const [confirmPlayer, setConfirmPlayer] = useState<string | "null">("null");
  const [confirmQte, setConfirmQte] = useState<number | 0>(0);
  const [confirmImg, setConfirmimg] = useState<string | "">("");
  const [amount, setAmount] = useState(1);
  const [showSearch, setShowSearch] = useState(false);
const [searchTerm, setSearchTerm] = useState("");
   const canvasRef = useRef<HTMLCanvasElement>(null);
   const [xpToAdd, setXpToAdd] = useState(0);
const [cmd, setCmd] = useState("");
  const [selected, setSelected] = useState<AnimationName>("Idle");

const viewerRef = useRef<SkinViewer | null>(null);
const [tooltip, setTooltip] = useState<{ x: number; y: number; ench: any[] } | null>(null);

  
  const [skinBase64, setSkinBase64] = useState<string>("http://textures.minecraft.net/texture/ed2930974def0892799eb046c1b61a51148c4f54087c2ccc9680fbbc7fed7298");
//  const skinUrl = "eyJ0aW1lc3RhbXAiOjE1ODgwMjAxMDQzMDUsInByb2ZpbGVJZCI6IjA0YjcwOGEzMzU2NjRmMmY4NWVjNWVlZjI3ZDE0ZGFkIiwicHJvZmlsZU5hbWUiOiJWaW9sZXRza3l6eiIsInNpZ25hdHVyZVJlcXVpcmVkIjp0cnVlLCJ0ZXh0dXJlcyI6eyJTS0lOIjp7InVybCI6Imh0dHA6Ly90ZXh0dXJlcy5taW5lY3JhZnQubmV0L3RleHR1cmUvZTk2YzYzMDllZmMyYmY5MGZiODBkMjRhYTNkM2M1NzFkZjdiYTY4NDY3ZWZiZWIzNTViYmRlNzM1OWJlODA3MCJ9fX0=";
useEffect(() => {
 const fetchSkin = async () => {
      try {
        const res = await fetch(skinBase64);
        if (!res.ok) throw new Error("Failed to fetch skin");
        const blob = await res.blob();

        const reader = new FileReader();
        reader.onloadend = () => {
          setSkinBase64(reader.result as string);
        };
        reader.readAsDataURL(blob);
      } catch (err) {
        console.error(err);
      }
    };
    console.log("Fetching skin from URL:", skinBase64);
    fetchSkin();

  return () => {
    viewerRef.current?.dispose();
  };
}, [canvasRef, width, height]);
const askRemove = (player:string, item:string, qte: number, imag: string) => {
    setConfirmItem(item);
    setConfirmPlayer(player);
    setConfirmQte(qte);
    setConfirmimg(imag);
  };

   const doRemove = () => {
    HandleRemoveItem(confirmPlayer || "", confirmItem || "", confirmQte || 1);

    setConfirmItem("null");
    setConfirmPlayer("null");
    setConfirmimg("");
  };
// Load skin whenever it changes
useEffect(() => {
  if (skinBase64 && viewerRef.current) {
    //viewerRef.current.resetSkin();
     //viewerRef.current.renderer.resetState();
     //  viewerRef.current.renderer.autoClear = true;
    
    viewerRef.current.loadSkin(skinBase64);
    viewerRef.current.nameTag = playerName || "Player";
    viewerRef.current.zoom = 1.5;
    viewerRef.current.autoRotate = true;
    
   
  }
}, [skinBase64]);
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours}h ${minutes}m ${seconds}s`;
};
  // If you want to dynamically change the skin later:
 useEffect(() => {
    let mounted = true;

    // Initial fetch
    fetchDetails();

    // Set up polling interval
    const intervalId = setInterval(() => {
      if (mounted) {
        fetchDetails(true); // background fetch
      }
    }, 50000 ); 

    // Cleanup on unmount
    return () => {
      mounted = false;
      clearInterval(intervalId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerName]);
  

const clearinv = async (pname: string) => {
    if (!pname.trim() || loading) return;

    setLoading(true);
    try {
      await ApiClient.executeCommand("clear "+ pname);
      setCmd(""); // Clear input only for manual commands
    } catch (err) {
      console.error("Error executing command:", err);
    } finally {
      setLoading(false);
    }
  };const pngFiles = import.meta.glob("/src/assets/mcicon/*.png", {
  eager: true,
  import: "default"
});

const gifFiles = import.meta.glob("/src/assets/mcicon/*.webp", {
  eager: true,
  import: "default"
});

async function HandleRemoveItem(player: string, item:string, amount: number){
  if(player && item){
    let res : any;
    console.log(player, item, amount)
    try{
     res = await ApiClient.removeItem(player,item,amount.toString());
    if(res.success){
      console.log(JSON.parse(res));
      window.alert('removed item from player');
    }else{
      console.error(JSON.stringify(res));
    }

    }catch(err){
      console.error(err);



    }



  }

  await fetchDetails();

}
// merge into one object
const itemFiles = { ...pngFiles, ...gifFiles };
 const items: { id: string, src: string }[] = Object.keys(itemFiles).map((path) => {
    const id = path.split("/").pop()?.replace(".png", "")?.replace(".webp", "")?.toLowerCase() || "";
    return { id, src: itemFiles[path] as string };
  });

  // Filter items based on the search term
  const filteredItems = useMemo(() => items.filter(item =>
    item.id.replace(/_/g, ' ').toLowerCase().includes(searchTerm.toLowerCase())
  ), [items, searchTerm]);

  // When the filter changes, update the selected item to the first in the list
useEffect(() => {
  if (filteredItems.length > 0 && !filteredItems.some(item => item.id === selectedItem)) {
    setSelectedItem(filteredItems[0].id);
  }
}, [filteredItems, selectedItem]);

async function addExperience(playerId: string, xp: number) {
  try {
    const response = await fetch(`http://localhost:3001/api/players/givexp/${playerId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ xp }),
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.message || "Failed to add experience.");
    }

    const result = await response.json();
    console.log("Experience added:", result);
    return result;
  } catch (error: any) {
    console.error("Error adding experience:", error.message || error);
    return null;
  }
}

  const giveItemHandler = async (item: string, qty: number, player: string) => {
    item = item.toLowerCase()
    if (!player) return;
    try {
      const res = await fetch(`http://localhost:3001/api/players/give/${player}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item, amount: qty }),
      });
      const data = await res.json();
      if (data.success) alert(`Gave ${qty}x ${item} to ${player}`);
      else alert("Failed: " + data.message);
    } catch (err) {
      console.error(err);
      alert("Error giving item");
    }
  };

  const selectedItemObj = items.find((i) => i.id === selectedItem);

const handlekill = async (playerName: string) => {
    try {
      const result = await ApiClient.killPlayer(playerName);
      if (result.success) {
        setSuccess(`✓ ${playerName} has been killed`);
        
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error(err);
    }

  };
  async function fetchDetails(background = false) {
    if (!playerName) return;
    const hadData = !!data;
    if (background && hadData) setIsRefreshing(true);
    else setLoading(true);
    if (!background) setError(null);
    try {
      const resp: any = await ApiClient.getPlayerDetails(playerName);
      // resp expected shape: { success: boolean, raw: string }
      if (resp && resp.success && resp.raw) {
        // Update raw and parsed data
        console.log(resp);
        setRaw(resp);

        // Parse raw console output to get player data
        const parsed = parsePlayerDataFromRaw(resp);

        const pd: PlayerData = {
          name: parsed.player || playerName,
          uuid: parsed.uuid,
          skin: parsed.skin?.textures_base64 || undefined,
          health: parsed.health.current,
          maxHealth: parsed.health.max,
          hunger: parsed.hunger.food_level,
          saturation: parsed.hunger.saturation,
          maxHunger: 20,
          offhand: parsed.off_hand.type,
          coorinates: parsed.locationc,
          bed_spawnx: parsed.locBedspawn,
          total: parsed.session_time.total,
          current:parsed.session_time.current,

          offhmt: parsed.off_hand.amount,
         offhanddurability: parsed.off_hand.durability,
        offhandmaxdurability: parsed.off_hand.maxdurability,
          offhandenchantments: parsed.off_hand.enchantments,
          level: parsed.experience.level,
          experience: parsed.experience.total_experience,
          inventory: parsed.inventory.map((it: any) => ({
            slot: Number(it.slot),
            id: String(it.type || 'unknown')
              .toLowerCase()
              .replace(/^minecraft:/, ''),
            count: Number(it.amount || 1),
            durability: Number(it.durability || 0),
            maxdurability: Number(it.maxdurability || 0),
           enchantments: Array.isArray(it.enchantments) ? it.enchantments : []

          })),
          armor: parsed.armor,
          statistics: parsed.statistics,
          advancements: parsed.advancements,
        };
      
       console.log('Parsed player data pd from playerdatailtsx:', pd);
      
       
      
        setData(pd);
        let testkresp: any;
         try{
        console.log(pd.uuid);
       testkresp= await ApiClient.hanlekillplayer(pd.uuid || '');
       console.log(testkresp);
       }catch (error){
        console.log("theres error here");
        console.error(error);
        
       }
       if (testkresp && testkresp.success){
        console.log("Setting kill data:", testkresp);
        setkilldata(testkresp);
       }else{
        console.warn("Failed to fetch kill data:", testkresp);
        setkilldata(null);
       }
       
        setSkinBase64( pd.skin || "http://textures.minecraft.net/texture/10497342d3e80834a1c3bc3cc08b1089598efff7ff048b318285f85bba39b7d3");
      } else {
        // Backend didn't return success
        if (!background) {
          setRaw(resp?.raw || null);
          setError(resp?.message || "No data available from server");
          setData(null);
           setkilldata(null);
        } else {
          // background fetch failed - keep existing UI and optionally log
          console.warn('Background fetch failed', resp?.message);
        }
      }
    } catch (err: any) {
      if (!background) {
        setError(String(err?.message || err || "Unknown error"));
        setData(null);
         setkilldata(null);
      } else {
        console.warn('Background fetch error', err);
      }
    } finally {
      if (background && hadData) setIsRefreshing(false);
      else setLoading(false);
    }
  }

  // Build a 36-slot mapping and render simple grid
  
  function renderInventoryGrid(inv?: InvItem[]) {
    const slots: (InvItem | null)[] = new Array(36).fill(null);
    (inv || []).forEach(i => {
      if (Number.isFinite(i.slot) && i.slot >= 0 && i.slot < 36) slots[i.slot] = i;
    });

    return (
      <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(9, 1fr)",
    gap: 12,
    padding: 12,
    background: "#0a0a0a",
    borderRadius: 8,
  }}
>
  {slots.map((s, idx) => {
    let img = s ? getItemImage(s.id) : null;
    if (s?.enchantments.length || 0> 0) {
        // console.log("Getting enchanted image for:", s?.id);
         img = getItemImage(s?.id , "armor");
    }
    
     const durabilityPercent =
          s && s.durability > 0 && s.maxdurability > 0
            ? Math.max(0, Math.min(100, (s.durability / s.maxdurability) * 100))
            : 0;
    return (
     <div
  key={idx}
  style={{
    minHeight: 80,
    borderRadius: 6,
    background: "#1c1c1c",
    border: "2px solid #333",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    position: "relative",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)",
    transition: "0.2s",
    cursor: "pointer",
  }}
  onClick={async () => {askRemove(data?.name || "", s?.id || "", s?.count || 1, img || "")}}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,255,0,0.4)";
    
    if (s?.enchantments.length || 0 > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        ench: s?.enchantments || [],
      });
    }
  }}

  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)";
    setTooltip(null);
  }}
>
{tooltip && (
  <div
    style={{
      position: "fixed",
      top: tooltip.y,
      left: tooltip.x,
      transform: "translateX(-50%)",
      background: "#0d0d0d",
      padding: "8px 12px",
      border: "1px solid #3aff8a",
      borderRadius: 6,
      color: "#c9ffd6",
      fontFamily: "Consolas, monospace",
      fontSize: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
      pointerEvents: "none",
      zIndex: 9999,
      whiteSpace: "nowrap",
    }}
  > 
    {tooltip.ench.map((e, i) => (
     
      <div key={i}>
        ✨ {e.name.replace(/_/g, " ")} {e.level}
      </div>
    ))}
  </div>
)}
{confirmPlayer!="null" && (

 <ConfirmRemove
        item={confirmItem}
        player={confirmPlayer}
        qte={confirmQte}
        imgx={confirmImg}
        onCancel={() => {
          setConfirmItem("null");
          setConfirmPlayer("null");

        }}
      onConfirm={doRemove}
      
      />
)}
        {/* Slot number */}
        <div
          style={{
            fontSize: 12,
            color: "#7a7a7a",
            marginBottom: 4,
            fontFamily: "Consolas, monospace",
            textShadow: "0 0 1px #000",
          }}
        >
          
🔨{s?.durability || 0 > 0 && (
  <div
    style={{
      fontSize: 12,
      color: "#7a7a7a",
      marginBottom: 4,
      fontFamily: "Consolas, monospace",
      textShadow: "0 0 1px #000",
    }}
  >
    🔨 {s?.durability}
  </div>
)}
        </div>

        {s ? (
          <div style={{ textAlign: "center" }}>
            {img ? (
              <img
                src={img}
                alt={s.id}
                style={{
                  width: 44,
                  height: 44,
                  display: "block",
                  margin: "0 auto 4px",
                  
                  borderRadius: 4,
                 // background: "#111",
                 // boxShadow: "0 1px 3px rgba(0,255,0,0.2)",
                }}
              />
            ) : (
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  textTransform: "capitalize",
                  color: "#c9ffd6",
                  textShadow: "0 0 2px #000",
                }}
              >
                {s.id.replace(/_/g, " ")}
              </div>
            )}
            <div
              style={{
                fontSize: 13,
                color: "#bfe6c7",
                marginTop: 2,
                fontWeight: "bold",
                textShadow: "0 0 2px #000",
              }}
            >
              x{s.count}
            </div>
          </div>
        ) : (
          <div
            style={{
              color: "#3a3a3a",
              fontSize: 12,
              fontFamily: "Consolas, monospace",
            }}
          >
            empty
          </div>
        )}
      </div>
    );
  })}
</div>

    );
  }

  const headerStyle = { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 20 } as const;
  const card = { background: '#0b0b0b', padding: 14, borderRadius: 10, border: '1px solid #222', boxShadow: '0 6px 18px rgba(0,0,0,0.5)' } as const;

  return (
    <div style={{ padding: 22, color: '#e6ffe8', fontFamily: 'Inter, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial' }}>
      <div style={headerStyle}>
        <button onClick={() => navigate(-1)} style={{ padding: '12px 16px', background: '#151515', color: '#7efc7e', borderRadius: 8, border: '1px solid #203020', fontSize: 16 }}>← Back</button>
        <div>
          <div style={{ color: '#9ff29f', fontSize: 32, fontWeight: 700 }}>{playerName}</div>
          


<div
  style={{
    color: '#93f093',
    fontSize: 16,
    marginTop: 8,
    display: 'flex',
    gap: '30px',
    alignItems: 'center',
  
  }}
>
  <span style={{ fontWeight: 'bold' }}>Play Time:</span>
  <span>Total: {formatTime(data?.total || 0)}</span>
  <span>Current session: {formatTime(data?.current || 0)}</span>
</div>

        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 10 }}>

  {/* Kill Button */}
  <button
    onClick={() => handlekill(playerName || "")}
    style={{
      padding: "12px 20px",
      background: "linear-gradient(145deg, #650606, #8b0c0c)",
      color: "#fff",
      borderRadius: 10,
      border: "1px solid #420404",
      fontSize: 14,
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(255,0,0,0.6)")}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)")}
  >
    Kill
  </button>

  {/* Message Button */}
  <button
    onClick={() => setIsOpen(true)}
    style={{
      padding: "12px 20px",
      background: "linear-gradient(145deg, #0a1e2c, #15334c)",
      color: "#dfffe0",
      borderRadius: 10,
      border: "1px solid #234",
      fontSize: 14,
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
      transition: "all 0.2s ease",
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,255,170,0.6)")}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)")}
  >
    Message
  </button>

  {/* Command Modal */}
  {isOpen && (
    <CommandModal
      onClose={() => setIsOpen(false)}
      playerN={playerName || ""}
    />
  )}

  {/* Refresh Button */}
  <button
    onClick={() => fetchDetails(false)}
    style={{
      padding: "12px 20px",
      background: "linear-gradient(145deg, #122, #244)",
      color: "#dfffe0",
      borderRadius: 10,
      border: "1px solid #234",
      fontSize: 14,
      fontWeight: "bold",
      cursor: "pointer",
      boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
      transition: "all 0.2s ease",
      position: "relative",
    }}
    onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,255,159,0.6)")}
    onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.4)")}
  >
    Refresh
    {isRefreshing && (
      <span
        title="Refreshing..."
        style={{
          color: "#9ff29f",
          fontSize: 20,
          marginLeft: 8,
          display: "inline-block",
          animation: "spin 1s linear infinite",
        }}
      >
        ⟳
      </span>
    )}
  </button>
</div>

{/* Add a simple keyframes animation for the refresh icon */}
<style>
{`
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`}
</style>

        </div>
        
      </div>

      {loading && <div style={{ color: '#a6a6a6', fontSize: 18, marginBottom: 20 }}>Loading player details...</div>}
      {error && <div style={{ background: '#3a0a0a', color: '#ffb3b3', padding: 16, borderRadius: 8, fontSize: 16, marginBottom: 20 }}>{error}</div>}

      {!loading && data && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 18 }}>
          <div>
            <div style={{ ...card, marginBottom: 14 }}>
             <div style={{ marginBottom: 14 }}>
  
  {/* UUID Label */}
 <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14
  }}
>
  {/* UUID Label */}
  <div style={{ color: '#93f093', fontSize: 16, fontWeight: 600 }}>
    UUID
  </div>

  {/* UUID Value */}
  <div
    style={{
      color: '#eaffea',
      fontFamily: 'monospace',
      fontSize: 14
    }}
  >
    {data.uuid || '—'}
  </div>
</div>


 

  {/* Coordinates (Actual + Bed) */}
  
<div
  style={{
    marginTop: 10,
    display: "flex",
    gap: 40,
    alignItems: "flex-start",
  }}
>
  {/* Actual Coords */}
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <FiMapPin style={{ color: "#93f093", fontSize: 18 }}
     />

    <div>
      <div style={{ color: "#93f093", fontSize: 14, fontWeight: 600 }}>
        Coordinate
      </div>
      <div
        style={{
          color: "#eaffea",
          fontFamily: "monospace",
          marginTop: 4,
          fontSize: 13,
        }}
      >
        X: {data.coorinates?.x.toFixed(2) ?? "—"} | Y: {data.coorinates?.y.toFixed(2)  ?? "—"} | Z:{" "}
        {data.coorinates?.z.toFixed(2)  ?? "—"}
      </div>
    </div>
  </div>

  {/* Bed Coords */}
  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
    <FaBed style={{ color: "#93f093", fontSize: 18 ,cursor: "pointer",}} onClick={() => handleTeleport(data.name || "none",data.bed_spawnx?.x || 0,  data.bed_spawnx?.z || 0,  data.bed_spawnx?.y || 0, data.bed_spawnx?.set || false)}/>

    <div>
      <div style={{ color: "#93f093", fontSize: 14, fontWeight: 600 }} >
        Bed
      </div>

      <div
        style={{
          color: "#eaffea",
          fontFamily: "monospace",
          marginTop: 4,
          fontSize: 13,
        }}
      >
        {data?.bed_spawnx?.set ? (
          <>
            X: {data.bed_spawnx.x ?? "—"} | Y:{" "}
            {data.bed_spawnx.y ?? "—"} | Z:{" "}
            {data.bed_spawnx.z ?? "—"}
          </>
        ) : (
          "—"
        )}
      </div>
    </div>
  </div>
</div>

</div>
<div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
<div style={{ marginTop: 20 }}>
  <div
    style={{
      color: "#0f0",
      fontWeight: "bold",
      fontFamily: "Consolas, monospace",
      textShadow: "0 0 6px #0f0",
      marginBottom: 8,
      letterSpacing: 0.5,
    }}
  >
    Give Item:
  </div>

  <div
    style={{
      display: "flex",
      gap: 12,
      alignItems: "center",
      background: "#0a0a0a",
      border: "1px solid #0f0",
      padding: "12px 14px",
      borderRadius: 8,
      boxShadow: "0 0 12px #0f03",
      flexWrap: "wrap", // prevents overflow
    }}
  >
    {/* Search Button */}
    <div
      onClick={() => setShowSearch(!showSearch)}
      style={{
        cursor: "pointer",
        padding: 6,
        borderRadius: 6,
        border: "1px solid #0f0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#000",
        color: "#0f0",
        fontSize: 18,
        transition: "0.2s",
        boxShadow: showSearch ? "0 0 8px #0f0" : "none",
      }}
      title="Search items"
    >
      <FiSearch />
    </div>

    {/* Search Input */}
    {showSearch && (
      <input
        type="text"
        placeholder="Search item..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          padding: "6px 10px",
          background: "#000",
          border: "1px solid #0f0",
          borderRadius: 6,
          color: "#0f0",
          fontFamily: "monospace",
          fontSize: 14,
          boxShadow: "0 0 8px #0f02 inset",
          flex: 1,
          minWidth: 150,
        }}
      />
    )}

    {/* Item Selector */}
    <select
      value={selectedItem}
      onChange={(e) => setSelectedItem(e.target.value)}
      style={{
        padding: "6px 10px",
        background: "#000",
        border: "1px solid #0f0",
        borderRadius: 6,
        color: "#0f0",
        fontFamily: "monospace",
        cursor: "pointer",
        fontSize: 14,
        boxShadow: "0 0 8px #0f02 inset",
        minWidth: 150,
      }}
    >
      {filteredItems.map((item) => (
        <option
          key={item.id}
          value={item.id}
          style={{ background: "#111", color: "#0f0" }}
        >
          {item.id
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase())}
        </option>
      ))}
    </select>

    {/* Item Image */}
    {selectedItemObj && (
      <div
        style={{
          background: "#000",
          padding: 4,
          borderRadius: 6,
          border: "1px solid #0f0",
          boxShadow: "0 0 8px #0f0",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src={selectedItemObj.src}
          alt={selectedItem}
          style={{ width: 32, height: 32 }}
        />
      </div>
    )}

    {/* Amount */}
    <input
      type="number"
      min={1}
      max={64}
      value={amount}
      onChange={(e) =>
        setAmount(Math.min(64, Math.max(1, Number(e.target.value))))
      }
      style={{
        width: 70,
        padding: "6px 10px",
        background: "#000",
        border: "1px solid #0f0",
        borderRadius: 6,
        color: "#0f0",
        fontFamily: "monospace",
        fontSize: 14,
        boxShadow: "0 0 8px #0f03 inset",
      }}
    />

    {/* Give Button */}
    <button
      onClick={() => giveItemHandler(selectedItem, amount, playerName || "")}
      style={{
        padding: "8px 16px",
        background: "#0f0",
        color: "#000",
        borderRadius: 6,
        fontWeight: "bold",
        cursor: "pointer",
        border: "2px solid #0f0",
        fontFamily: "Consolas, monospace",
        transition: "0.2s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 12px #0f0")}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
    >
      GIVE
    </button>
  </div>
</div>


  

</div>

              <div style={{ height: 12 }} />
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, ...card, padding: 16 }}>
                  <div style={{ color: '#9fbf9f', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>❤️ Health</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                    <div style={{ flex: 1, height: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #111', display: 'flex' }}>
                      {(() => {
                        const maxH = Number.isFinite(Number(data.maxHealth)) && data.maxHealth ? Number(data.maxHealth) : 20;
                        const val = Number.isFinite(Number(data.health)) ? Number(data.health) : 0;
                        const pct = Math.max(0, Math.min(100, Math.round((val / maxH) * 100)));
                        const normalizedVal = (val / maxH) * 10;
                        const fullHearts = Math.floor(normalizedVal);
                        const hasHalf = normalizedVal - fullHearts < 0.5 && normalizedVal - fullHearts > 0;
                        return (
                          <div style={{ width: `${pct}%`, display: 'flex', alignItems: 'center', gap: 0, transition: 'width 200ms', overflow: 'hidden' }}>
                            {Array.from({ length: fullHearts }).map((_, i) => (
                              <img key={`full-${i}`} src={heartIcon} alt="heart" style={{ width: 18, height: 18, flexShrink: 0 }} />
                            ))}
                            {hasHalf && <img src={halfhIcon} alt="half-heart" style={{ width: 18, height: 18, flexShrink: 0 }} />}
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ color: '#ffbcbc', fontWeight: 700, minWidth: 80, textAlign: 'right', fontSize: 16 }}>{Number.isFinite(data.health || NaN) ? `${data.health}/${data.maxHealth ?? 20}` : '—'}</div>
                  </div>
                </div>

                <div style={{ flex: 1, ...card, padding: 16 }}>
                  <div style={{ color: '#9fbf9f', fontSize: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>🍖 Hunger</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
                    <div style={{ flex: 1, height: 20, borderRadius: 8, overflow: 'hidden', border: '1px solid #0b100b', display: 'flex' }}>
                      {(() => {
                        const maxF = Number.isFinite(Number(data.maxHunger)) && data.maxHunger ? Number(data.maxHunger) : 20;
                        const val = Number.isFinite(Number(data.hunger)) ? Number(data.hunger) : 0;
                        const pct = Math.max(0, Math.min(100, Math.round((val / maxF) * 100)));
                        const meatCount = Math.ceil((pct / 100) * 10);
                        return (
                          <div style={{ width: `${pct}%`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingLeft: 2, gap: 1, transition: 'width 200ms', overflow: 'hidden' }}>
                            {Array.from({ length: meatCount }).map((_, i) => (
                              <span key={i} style={{ fontSize: 14, lineHeight: 1 }}>🍖</span>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                    <div style={{ color: '#fff0c2', fontWeight: 700, minWidth: 80, textAlign: 'right', fontSize: 16 }}>{Number.isFinite(data.hunger || NaN) ? `${data.hunger}/${data.maxHunger ?? 20}` : '—'}</div>
                  </div>
                   </div>

                <div style={{ width: 150, ...card, padding: 16 }}>
                  <div style={{ color: '#9fbf9f', fontSize: 16, fontWeight: 600 }}>Level</div>
                  <div style={{ color: '#bfffbf', fontWeight: 800, marginTop: 8, textAlign: 'center', fontSize: 24 }}>{Number.isFinite(data.level || NaN) ? data.level : '—'}</div>
                </div>
              </div>
            </div>

            <div style={{ ...card }}>
              <div style={{ color: '#9ff29f', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Inventory</div>
     <div
  style={{
    display: "flex",           // parent flex container
    justifyContent: "center",  // center horizontally
    marginTop: 12,
  }}
>
  <div
    style={{
      textAlign: "center",
      color: "#c9ffd6",
      fontFamily: "Consolas, monospace",
      padding: 8,
      background: "#0a0a0a",
     // border: "2px solid #0f0",
      borderRadius: 6,
      width: 80,
     // boxShadow: "0 0 8px rgba(0,255,0,0.2), inset 0 1px 2px rgba(255,255,255,0.1)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",     
    }}
      
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,255,0,0.4)";
    
    if (data?.offhandenchantments?.length || 0 > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        ench: data.offhandenchantments || [],
      });
    }
  }}
 

  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)";
    setTooltip(null);
  }}
  {...tooltip && (
  <div
    style={{
      position: "fixed",
      top: tooltip.y,
      left: tooltip.x,
      transform: "translateX(-50%)",
      background: "#0d0d0d",
      padding: "8px 12px",
      border: "1px solid #3aff8a",
      borderRadius: 6,
      color: "#c9ffd6",
      fontFamily: "Consolas, monospace",
      fontSize: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
      pointerEvents: "none",
      zIndex: 9999,
      whiteSpace: "nowrap",
    }}
  >
    {tooltip.ench.map((e, i) => (
      <div key={i}>
        ✨ {e.name.replace(/_/g, " ")} {e.level}
      </div>
    ))}
  </div>
)}
  >
    
   {(() => {
  const offhandId = (data.offhand || "  ").toLowerCase();
  const hasEnchantments = data.offhandenchantments || 0 > 0;
  const offhandImg = hasEnchantments
    ? getItemImage(offhandId, "armor")
    : getItemImage(offhandId);

  return offhandImg ? (
    <img
      src={offhandImg}
      alt={offhandId}
      style={{
        width: 44,
        height: 44,
        marginBottom: 4,
        borderRadius: 4,
      }}
    />
  ) : (
    <div
      style={{
        fontSize: 14,
        fontWeight: 700,
        textTransform: "capitalize",
        color: "#c9ffd6",
        textShadow: "0 0 2px #000",
        marginBottom: 4,
      }}
    >
      {offhandId.replace(/_/g, " ")}
    </div>
  );
})()}

🔨{data.offhanddurability || 0 > 0 && (
  <div
    style={{
      fontSize: 12,
      color: "#7a7a7a",
      marginBottom: 4,
      fontFamily: "Consolas, monospace",
      textShadow: "0 0 1px #000",
    }}
  >
    🔨 { data.offhanddurability}
  </div>
)}
    <div
      style={{
        fontSize: 13,
        color: "#bfe6c7",
        marginTop: 2,
        fontWeight: "bold",
        textShadow: "0 0 2px #000",
      }}
    >
      x{data.offhmt || 0}
    </div>

    <div
      style={{
        fontSize: 12,
        color: "#7a7a7a",
        marginTop: 2,
        textTransform: "uppercase",
        textShadow: "0 0 1px #000",
      }}
    >
      Off hand
    </div>
  </div>
</div>


              
              {renderInventoryGrid(data.inventory)}
              <button
  onClick={() => clearinv(playerName || "")}
  style={{
    display: "flex",           // parent flex container
    justifyContent: "center",  // center horizontally
    marginTop: 12,
    padding: "8px 16px",
    background: "rgba(0, 0, 0, 0.6)",
    border: "2px solid rgba(106, 1, 1, 1)",
    color: "#0f0",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontFamily: "Consolas, monospace",
    letterSpacing: "0.5px",
    transition: "all 0.2s ease",
    boxShadow: "0 0 8px #0f03, inset 0 0 4px #0f03",
  }}
  onMouseEnter={(e) => {
    const btn = e.currentTarget as HTMLButtonElement; //  ✔ safe
    btn.style.background = "rgba(197, 4, 4, 1)";
    btn.style.color = "#000";
    btn.style.boxShadow = "0 0 12px rgba(54, 0, 0, 0.47), inset 0 0 6px #0f05";
    btn.style.transform = "translateY(-2px)";
  }}
  onMouseLeave={(e) => {
    const btn = e.currentTarget as HTMLButtonElement; //  ✔ safe
    btn.style.background = "rgba(0,0,0,0.6)";
    btn.style.color = "#0f0";
    btn.style.boxShadow = "0 0 8px #0f03, inset 0 0 4px #0f03";
    btn.style.transform = "translateY(0)";
  }}
> Clear Invetory</button>
            </div>

            {Array.isArray(data.armor) && data.armor.length > 0 && (
              <div style={{ ...card, marginTop: 14 }}>
                <div style={{ color: '#9ff29f', fontSize: 18, fontWeight: 600, marginBottom: 12  }}>Armor</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {data.armor.map((a, idx) => {
                    let armorImg = a.type ? getItemImage(a.type) : null;
                    if(a.enchantments?.length || 0 > 0){
                      // console.log("Getting enchanted image for armor:", a.type);
                      armorImg = getItemImage(a.type , "armor");
                    }
                    return (
                      <div key={idx} style={{ flex: 1, minHeight: 100, background: '#0b0b0b', padding: 12, borderRadius: 6, border: '1px solid #1a3a1a', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontSize: 14, color: '#888', marginBottom: 8, fontWeight: 600 }}
                        
                        ></div>
                        {armorImg ? (
                          <img src={armorImg} alt={a.type} style={{ width: 50, height: 50, marginBottom: 8 } }
                        onMouseEnter={(e) => {
                          e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,0.15), 0 2px 8px rgba(0,255,0,0.4)";
    
    if (a.enchantments?.length || 0 > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      setTooltip({
        x: rect.left + rect.width / 2,
        y: rect.top - 10,
        ench: a?.enchantments || [],
      });
    }
                        } }
  onClick={async () => {askRemove(data?.name || "", a?.type.toLowerCase() || "", a.amount, armorImg)}}
                      
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow =
      "inset 0 1px 0 rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)";
    setTooltip(null);
  }}
  
{...tooltip && (
  <div
    style={{
      position: "fixed",
      top: tooltip.y,
      left: tooltip.x,
      transform: "translateX(-50%)",
      background: "#0d0d0d",
      padding: "8px 12px",
      border: "1px solid #3aff8a",
      borderRadius: 6,
      color: "#c9ffd6",
      fontFamily: "Consolas, monospace",
      fontSize: 12,
      boxShadow: "0 2px 8px rgba(0,0,0,0.7)",
      pointerEvents: "none",
      zIndex: 9999,
      whiteSpace: "nowrap",
    }}
  >
    {tooltip.ench.map((e, i) => (
      <div key={i}>
        ✨ {e.name.replace(/_/g, " ")} {e.level}
      </div>
    ))}
  </div>
)}
                        />
                        ) : (
                          
                          <div style={{ color: '#c9ffd6', fontSize: 14, fontWeight: 700, textTransform: 'capitalize', marginBottom: 8 }}>{a.type?.replace("_", ' ').toLowerCase() || 'unknown'}</div>
                        )}
                        <div style={{ color: '#bfe6c7', fontSize: 14 }}>{a.type?.replace("_", ' ').toLowerCase() || 'unknown'}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {data.experience !== undefined && (
              <div style={{ ...card, marginTop: 14 }}>
    {/* Add XP Control */}
    <div
      style={{
        display: "flex",
        gap: 8,
        marginBottom: 12,
        alignItems: "center",
      }}
    >
      <input
        type="number"
        min={0}
        value={xpToAdd}
        onChange={(e) => setXpToAdd(Number(e.target.value))}
        placeholder="XP"
        style={{
          flex: 1,
          padding: "6px 10px",
          background: "#000",
          border: "1px solid #0f0",
          borderRadius: 6,
          color: "#0f0",
          fontFamily: "monospace",
          fontSize: 14,
        }}
      />
      <button
        onClick={() => addExperience( playerName || "", xpToAdd)}
        style={{
          padding: "6px 14px",
          background: "#0f0",
          color: "#000",
          borderRadius: 6,
          fontWeight: "bold",
          cursor: "pointer",
          border: "2px solid #0f0",
          transition: "0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "0 0 12px #0f0")}
        onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
      >
        Add Experience Orb
      </button>
    </div>

    {/* Existing Experience Card */}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      <div
        style={{
          background: "#000",
          padding: 12,
          borderRadius: 6,
          border: "1px solid #1a3a1a",
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "#888",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Total XP
        </div>
        <div
          style={{
            color: "#bfffbf",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {Number.isFinite(Number(data.experience)) ? data.experience : "—"}
        </div>
      </div>
      <div
        style={{
          background: "#000",
          padding: 12,
          borderRadius: 6,
          border: "1px solid #1a3a1a",
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: "#888",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          Level
        </div>
        <div
          style={{
            color: "#bfffbf",
            fontWeight: 700,
            fontSize: 18,
          }}
        >
          {Number.isFinite(Number(data.level)) ? data.level : "—"}
        </div>
      </div>
    </div>
  </div>
            )}

            {data.statistics && Object.keys(data.statistics).length > 0 && (
              <div style={{ ...card, marginTop: 14 }}>
                <div style={{ color: '#9ff29f', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>Statistics</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {Object.entries(data.statistics).map(([key, val]) => (
                    <div key={key} style={{ background: '#000', padding: 12, borderRadius: 6, border: '1px solid #1a3a1a' }}>
                      <div style={{ fontSize: 14, color: '#888', marginBottom: 6, textTransform: 'capitalize', fontWeight: 600 }}>{key.replace(/_/g, ' ').replace('cm','meter').replace('fly','Run')}</div>
                      <div style={{ color: '#d6ffd6', fontWeight: 700, fontSize: 16 }}>{(Number(val) / 100).toLocaleString(undefined, { 
  minimumFractionDigits: 2, 
  maximumFractionDigits: 2 
})}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* mob stat */}
           
{killdata && Object.keys(killdata.kills).length > 0 && (
  <div style={{ ...card, marginTop: 14 }}>
    <div style={{ color: '#ff9f9f', fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
      Mob Kill Statistics
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
      {Object.entries(killdata.kills).map(([mob, countx]) => (
        <div key={mob} style={{ background: '#000', padding: 12, borderRadius: 6, border: '1px solid #3a1a1a' }}>
          <div style={{ fontSize: 14, color: '#bbb', textTransform: 'capitalize', marginBottom: 6 }}>
            {mob.replace(/_/g, ' ').toLowerCase()}
          </div>
          <div style={{ color: '#ffd6d6', fontWeight: 700, fontSize: 16 }}>
            {countx} 
          </div>
        </div>
      ))}
    </div>
  </div>
)}
          </div>

          <div style={{
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  marginTop: 20,
}}>
  <div style={{
    maxWidth: 250,
    height: 400,
    position: "relative",
    margin: "0 auto",
  }}>
    {/* Floating label */}
    <div style={{
      position: "absolute",
      top: "-18px",
      left: "50%",
      transform: "translateX(-50%)",
      background: "#111",
      padding: "2px 10px",
      fontWeight: "bold",
      fontSize: 14,
      borderRadius: 6,
      border: "2px solid #4CAF50",
      zIndex: 10,
    }}>
      {data?.name || ""}'s Skin
    </div>

    {/* FIX: Canvas wrapper that forces fit */}
   <div
      style={{
        width: "100%",
        height: "100%",
      }}
      className="skinviewer-container"
    >
      {skinBase64 ? (
        <div style={{ width: "100%", height: "100%", marginLeft: "-140px", fontFamily: "Minecraft" }}>
          
          {/* Skin Viewer */}
          <ReactSkinview3d
         
            skinUrl={skinBase64}
            width={500}
            height={500}
            onReady={({ viewer, canvasRef })=> {
              viewer.autoRotate = true;
              
            }}
            options={{
              nameTag: data?.name || "",
              zoom: 0.7,
              animation:  animations[selected](),
              
            }}
          />

          {/* Animation Selector */}
          <div style={{ marginTop: "-40px", paddingLeft: "150px" }}>
            <h3 style={{ color: "#0f0", marginBottom: "8px", fontFamily: "Minecraft" }}>
              Animation
            </h3>

            <div style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              color: "#9f9",
              fontFamily: "Minecraft",
            }}>
             {(Object.keys(animations) as AnimationName[]).map((anim) => (
  <label
  key={anim}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#111", // dark background
    padding: "6px 10px",
    borderRadius: "6px",
    cursor: "pointer",
    border: selected === anim ? "2px solid #3f3" : "2px solid #060",
    boxShadow: selected === anim ? "0 0 10px #3f3" : "none",
    fontFamily: "Minecraft",
    color: "#dfd",
  }}
>
  <input
    type="checkbox"
    checked={selected === anim}
    onChange={() => {
      setSelected(anim);
      // add any logic for changing animation here
    }}
    style={{
      width: "16px",
      height: "16px",
      cursor: "pointer",
      accentColor: "#3f3", // green checkmark when selected
    }}
  />
  {anim}
</label>

))}

            </div>
          </div>
        </div>
      ) : (
        <div>Loading skin...</div>
      )}
    </div>

  </div>
</div>

        </div>
      )}
      

    </div>
  );
}
