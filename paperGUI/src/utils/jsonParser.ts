export function parsePlayerDataFromRaw(rawx: any) {
  try {
   
/** 
 * 
 *  if (!raw || typeof raw !== 'string') {
      throw new Error('Invalid raw input');
    }
    // The plugin sometimes includes non-JSON text, so we need to find the JSON blob.
    // We find a known key, which should be unique, then find the surrounding braces.
    let searchIdx = raw.indexOf('"player"');
    if (searchIdx === -1) {
      searchIdx = raw.indexOf('"uuid"');
    }
    if (searchIdx === -1) {
      throw new Error('No valid player data key found in console output');
    }

    const openIdx = raw.lastIndexOf('{', searchIdx);
    if (openIdx === -1) {
      throw new Error('No opening brace found for player data object');
    }

    // Count braces to find the matching closing brace for the object
    let braceCount = 0;
    let closeIdx = -1;
    for (let i = openIdx; i < raw.length; i++) {
      if (raw[i] === '{') {
        braceCount++;
      }
      if (raw[i] === '}') {
        braceCount--;
        if (braceCount === 0) {
          closeIdx = i;
          break;
        }
      }
    }

    if (closeIdx === -1) {
      throw new Error('No matching closing brace found for player data');
    }
**/
   // const jsonStr = raw.substring(openIdx, closeIdx + 1);
    const rawParsed = rawx//JSON.parse(rawx);
    console.log("testing rawx",rawx);
    // The plugin sometimes wraps the output in a "test" property.
    // We'll use the content of "test" if it exists, otherwise use the root object.
    let dataObj = rawParsed.raw ? rawParsed.raw : rawParsed;
    dataObj = rawParsed.raw;
    console.log(dataObj);
    // The health object itself can be nested or its properties can be at the root.
    const healthObj = dataObj.health || dataObj;

    const playerData = {
      player: dataObj.player || null,
      uuid: dataObj.uuid || null,
    
      
      health: {
        current: healthObj.current !== undefined ? parseFloat(healthObj.current) : null,
        max: healthObj.max !== undefined ? parseFloat(healthObj.max) : 20,
      },
      locationc: dataObj.location || null,
      locBedspawn:dataObj.bed_spawn || null ,
      session_time:{
        current: dataObj.session_time.current || 0,
        total: dataObj.session_time.total || 0,
      },
      off_hand: {
        type: dataObj.off_hand?.type || null,
        amount: dataObj.off_hand?.amount || 0,
        durability: dataObj.off_hand?.durability !== undefined ? parseFloat(dataObj.off_hand.durability) : 0,
        maxdurability: dataObj.off_hand?.maxdurability !== undefined ? parseFloat(dataObj.off_hand.maxdurability) : 0,
        enchantments: Array.isArray(dataObj.off_hand?.enchantments) ? dataObj.off_hand.enchantments : [],
      },
      hunger: {
        food_level: dataObj.hunger?.food_level !== undefined ? parseFloat(dataObj.hunger.food_level) : null,
        saturation: dataObj.hunger?.saturation !== undefined ? parseFloat(dataObj.hunger.saturation) : 0,
      },
      experience: {
        level: dataObj.experience?.level !== undefined ? parseFloat(dataObj.experience.level) : 0,
        exp: dataObj.experience?.exp !== undefined ? parseFloat(dataObj.experience.exp) : 0,
        total_experience: dataObj.experience?.total_experience !== undefined ? parseFloat(dataObj.experience.total_experience) : 0,
      },
      inventory: Array.isArray(dataObj.inventory) ? dataObj.inventory : [],
      armor: Array.isArray(dataObj.armor) ? dataObj.armor : [],
      statistics: dataObj.statistics || {},
      advancements: dataObj.advancements || {},
      skin: dataObj.skin || null,
    };
    console.log("Parsed player data in the jsonParser js:", playerData);
    return playerData;
  } catch (error) {
    console.error("JSON parsing failed for raw output:", error);
    throw new Error(
      `Failed to parse player data: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export async function extractPlayerHead(skinUrl: string, size: number = 64): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous"; // Needed if skin is hosted elsewhere
    img.src = skinUrl;
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject("Cannot get canvas context");
      
      // Set canvas to desired size
      canvas.width = size;
      canvas.height = size;
      
      // Draw the head (8x8 pixels) from the skin (skin head is at 8,8)
      ctx.drawImage(img, 8, 8, 8, 8, 0, 0, size, size);
      
      resolve(canvas.toDataURL("image/png"));
    };
    
    img.onerror = (err) => reject(err);
  });
}