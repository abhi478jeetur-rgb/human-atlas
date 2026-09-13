export type SystemId = 'skeletal'|'muscular'|'arterial'|'venous'|'nervous'|'digestive'|'respiratory'|'urinary'|'reproductive'|'lymphatic'|'endocrine'|'integumentary'|'connective'|'sensory'|'cardiac';
export const SYSTEMS: {id:SystemId;name:string;color:string;description:string}[] = [
 {id:'skeletal',name:'Skeleton',color:'#e2d9ba',description:'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.'},
 {id:'muscular',name:'Muscles',color:'#a85b50',description:'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.'},
 {id:'cardiac',name:'Heart',color:'#b96760',description:'The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.'},
 {id:'sensory',name:'Sensory organs',color:'#b0c8ce',description:'These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.'},
 {id:'arterial',name:'Arteries',color:'#c05245',description:'The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.'},
 {id:'venous',name:'Veins',color:'#527c9f',description:'Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.'},
 {id:'nervous',name:'Nervous system',color:'#d8b565',description:'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.'},
 {id:'respiratory',name:'Respiratory',color:'#b98991',description:'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.'},
 {id:'digestive',name:'Digestive',color:'#b8916b',description:'The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.'},
 {id:'urinary',name:'Urinary',color:'#b47961',description:'The kidneys filter blood and regulate fluid, electrolyte, and acid–base balance. Urine travels through the ureters to the bladder and exits through the urethra.'},
 {id:'lymphatic',name:'Lymphatic',color:'#879f7c',description:'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.'},
 {id:'endocrine',name:'Endocrine',color:'#c5a09a',description:'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.'},
 {id:'reproductive',name:'Reproductive',color:'#bda098',description:'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.'},
 {id:'integumentary',name:'Body surface',color:'#ba9b7d',description:'The body surface provides an outer anatomical reference. The integumentary system forms a protective barrier and contributes to sensation and temperature regulation.'},
 {id:'connective',name:'Connective tissue',color:'#aec3bb',description:'Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.'},
];
export interface Part {id:string;name:string;conceptId:string;system:SystemId;chunk:number;positions:number;normals:number;indices:number;vertexCount:number;indexCount:number;bounds:[number[],number[]]}
export interface Concept {id:string;name:string;elements:string[]}
export interface Atlas {version:string;sex?:'male';source?:string;scope?:string;parts:Part[];concepts:Concept[];chunks:{url:string;bytes:number;gzip?:string;gzipBytes?:number}[];triangles:number}
export type View = 'three-quarter'|'front'|'back'|'side';
export interface SceneState {inspectorOpen?:boolean;explode:number;visible:SystemId[];selected:string[];isolate:boolean;view:View;rotate:boolean;reset:number}
export const DEFAULT_VISIBLE:SystemId[] = ['cardiac','sensory','skeletal','muscular','arterial','venous','nervous','respiratory','digestive','urinary','lymphatic','endocrine','reproductive','connective'];
export const EXPLANATIONS:Record<string,string> = {
 'heart':'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
 'liver':'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
 'brain':'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
 'stomach':'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
 'spleen':'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
 'pancreas':'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
 'urinary bladder':'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
 'trachea':'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
 'diaphragm':'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
 'lung':'Primary organs of respiration located within the thoracic cavity, exchanging oxygen and carbon dioxide between air and bloodstream.',
 'left lung':'The two-lobed left lung accommodating the cardiac notch, allowing space for the apex of the heart.',
 'right lung':'The three-lobed right lung, larger than the left, facilitating gas exchange across millions of alveoli.',
 'kidney':'Essential paired organs that filter waste and excess water from blood, forming urine and balancing electrolytes.',
 'left kidney':'Bean-shaped retroperitoneal organ on the left, regulating blood pressure, acid-base homeostasis, and erythropoiesis.',
 'right kidney':'Positioned slightly lower than the left due to the liver, purifying systemic blood and maintaining fluid osmolarity.',
 'aorta':'The primary and largest arterial trunk of the systemic circuit, originating from the left ventricle and distributing oxygenated blood.',
 'thyroid gland':'An endocrine butterfly-shaped gland located at the base of the neck, synthesizing hormones that regulate metabolic rate and protein synthesis.',
 'gallbladder':'A small pear-shaped organ nestled beneath the liver that stores and concentrates bile before releasing it into the duodenum for lipid digestion.',
 'esophagus':'A muscular canal traversing the posterior mediastinum that conveys food from the pharynx to the stomach via peristaltic waves.',
 'larynx':'The cartilaginous organ situated between the pharynx and trachea, housing the vocal cords for phonation and protecting the lower airway.',
 'cerebellum':'Located at the posterior base of the brain, coordinating fine voluntary motor control, equilibrium, balance, and spatial orientation.',
 'spinal cord':'The elongated cylindrical bundle of nervous tissue extending from the brainstem through the vertebral column, transmitting sensory and motor impulses.',
 'adrenal gland':'Endocrine glands perched atop each kidney, producing vital hormones including adrenaline, aldosterone, and cortisol.',
 'duodenum':'The first and shortest segment of the small intestine, receiving chyme from the stomach along with bile and pancreatic enzymes for chemical breakdown.',
 'femur':'The thigh bone; the longest, strongest, and heaviest tubular bone in the human skeleton, supporting body weight during ambulation.',
 'humerus':'The long bone of the upper arm, articulating proximally with the scapula at the glenohumeral joint and distally with the radius and ulna.',
 'skull':'The skeletal framework of the head comprising cranial and facial bones that encapsulate the brain and support sensory structures.',
 'mandible':'The largest and strongest bone of the human face, forming the lower jaw and holding the lower teeth in place for mastication.',
 'patella':'The sesamoid knee cap bone embedded within the quadriceps tendon, providing mechanical leverage and protecting the knee joint.',
 'sternum':'The flat breastbone situated centrally in the anterior thoracic wall, anchoring the ribs via costal cartilages.',
 'clavicle':'The collarbone acting as a strut between the sternum and scapula, enabling extensive range of shoulder movement.',
};
export function explanation(name:string,system:SystemId){
 const lower = name.toLowerCase();
 if (EXPLANATIONS[lower]) return EXPLANATIONS[lower];
 for (const [key, desc] of Object.entries(EXPLANATIONS)) {
  if (lower.includes(key) || key.includes(lower)) return desc;
 }
 return SYSTEMS.find(s=>s.id===system)?.description ?? '';
}

