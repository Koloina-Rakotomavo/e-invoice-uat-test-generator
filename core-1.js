"use strict";

const $ = id => document.getElementById(id);
const val = id => $(id).value.trim();
const esc = s => String(s ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&apos;");
const money = n => Number(n).toFixed(2);
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0,v=c==="x"?r:(r&3|8);return v.toString(16)}));

const META = {
 T000:{label:"Facture conforme",expected:"ACCEPTÉE",field:"Document complet",mutation:"Aucune"},
 T001:{label:"N° facture absent",expected:"REJET",field:"BT-1",mutation:"Suppression ID facture"},
 T002:{label:"SIREN acheteur absent",expected:"REJET",field:"BT-47",mutation:"Suppression SIREN acheteur"},
 T003:{label:"BT-49 absent",expected:"REJET / NON ROUTABLE",field:"BT-49",mutation:"Suppression EndpointID acheteur"},
 T004:{label:"Receiver différent du BT-49",expected:"REJET / ROUTAGE KO",field:"SBDH Receiver",mutation:"Receiver différent de l'Endpoint acheteur"},
 T005:{label:"Montant ligne 1 incohérent",expected:"REJET",field:"BT-131 ligne 1",mutation:"Montant net ligne 1 diminué de 1000"},
 T006:{label:"Total TVA incohérent",expected:"REJET",field:"BT-110",mutation:"Total TVA diminué de 1000"},
 T007:{label:"PMT absent",expected:"REJET",field:"PMT",mutation:"Suppression PMT"},
 T008:{label:"PMD absent",expected:"REJET",field:"PMD",mutation:"Suppression PMD"},
 T009:{label:"AAB absent",expected:"REJET",field:"AAB",mutation:"Suppression AAB"},
 T010:{label:"ID ligne 1 absent",expected:"REJET",field:"BT-126",mutation:"Suppression ID ligne 1"},
 T011:{label:"Quantité ligne 1 absente",expected:"REJET",field:"BT-129",mutation:"Suppression quantité ligne 1"},
 T012:{label:"Prix ligne 1 absent",expected:"REJET",field:"BT-146",mutation:"Suppression prix ligne 1"},
 T013:{label:"Catégorie TVA ligne 1 absente",expected:"REJET",field:"BT-151",mutation:"Suppression catégorie TVA ligne 1"},
 T014:{label:"ABZ immatriculation absent, AKG VIN conservé",expected:"ACCEPTÉE",field:"BT-18 / ABZ",mutation:"Suppression de l'immatriculation ABZ uniquement ; le VIN AKG reste présent en ligne"},
 T015:{label:"BT-18 qualifiant invalide",expected:"REJET",field:"BT-18-1",mutation:"Remplacement du schemeID par un code hors UNTDID 1153"},
 T016:{label:"BT-18 présent mais valeur vide",expected:"REJET",field:"BT-18",mutation:"Balise BT-18 conservée avec identifiant vide"},
 T017:{label:"AKG VIN absent, ABZ immatriculation conservée",expected:"ACCEPTÉE",field:"BT-128 / AKG",mutation:"Suppression du VIN AKG de la première ligne uniquement ; l'immatriculation ABZ reste présente"},
 T018:{label:"Mauvais qualifiant VIN : AKZ au lieu de AKG",expected:"CONTRÔLE MÉTIER KO",field:"BT-128-1",mutation:"Le VIN est qualifié AKZ alors que le code attendu pour un VIN/châssis est AKG"},
 T019:{label:"Bloc livraison supprimé",expected:"ACCEPTÉE",field:"BG-13 / BG-15",mutation:"Suppression complète du bloc Delivery optionnel"}
};

let lineCounter = 0, current = null, sessionTests = [];

const TEST_TARGETS = {
  T001:["invoiceId"],
  T002:["buyerSiren"],
  T003:["buyerEndpoint"],
  T004:["buyerEndpoint"],
  T005:["LINE1:net"],
  T006:["sumVat"],
  T007:["notePMT"],
  T008:["notePMD"],
  T009:["noteAAB"],
  T010:["LINE1:id"],
  T011:["LINE1:qty"],
  T012:["LINE1:price"],
  T013:["LINE1:vatCategory"],
  T014:["registrationId"],
  T015:["registrationId"],
  T016:["registrationId"],
  T017:["vinId"],
  T018:["vinId"],
  T019:["includeDelivery"]
};

function uatReady(){
  const values = [
    val("uatSupplierSiren"),
    val("uatSupplierEndpoint"),
    val("uatBuyerSiren"),
    val("uatBuyerEndpoint")
  ];
  return values.every(x => x && !x.includes("A_REMPLACER"));
}

function renderCriticalCheck(){
  const data = [
    ["SIREN vendeur", val("uatSupplierSiren")],
    ["Routage vendeur", val("uatSupplierEndpoint")],
    ["SIREN acheteur", val("uatBuyerSiren")],
    ["Routage acheteur / BT-49", val("uatBuyerEndpoint")]
  ];
  $("criticalCheck").innerHTML = data.map(([name,value])=>{
    const ok = value && !value.includes("A_REMPLACER");
    return `<div class="critical-item ${ok?"ok":"bad"}"><b>${ok?"OK":"À REMPLACER"}</b><br>${name}</div>`;
  }).join("");
}

function clearTestTargets(){
  document.querySelectorAll(".test-target").forEach(x=>x.classList.remove("test-target"));
  document.querySelectorAll(".test-target-label").forEach(x=>x.classList.remove("test-target-label"));
}

function highlightTarget(code){
  clearTestTargets();
  const targets = TEST_TARGETS[code] || [];
  for(const target of targets){
    if(target.startsWith("LINE1:")){
      const field = target.split(":")[1];
      const first = document.querySelector(".line-card");
      if(first){
        const el = first.querySelector(`[data-f="${field}"]`);
        if(el){
          el.classList.add("test-target");
          const lab = el.closest("div")?.querySelector("label");
          if(lab) lab.classList.add("test-target-label");
        }
      }
    } else {
      const el = $(target);
      if(el){
        el.classList.add("test-target");
        const lab = el.closest("div")?.querySelector("label");
        if(lab) lab.classList.add("test-target-label");
      }
    }
  }
}

function scenarioIndex(code){
  return Number(code.replace("T","")) || 0;
}

function randInt(min,max){
  return Math.floor(Math.random()*(max-min+1))+min;
}

function randChoice(arr){
  return arr[randInt(0,arr.length-1)];
}

function randMoney(min,max){
  return Math.round((min + Math.random()*(max-min))*100)/100;
}

function randomPlate(){
  const letters="ABCDEFGHJKLMNPRSTUVWXYZ";
  const L=()=>letters[randInt(0,letters.length-1)];
  return `${L()}${L()}-${randInt(100,999)}-${L()}${L()}`;
}

function randomVin(){
  const chars="ABCDEFGHJKLMNPRSTUVWXYZ0123456789";
  let s="VF1";
  while(s.length<17) s+=chars[randInt(0,chars.length-1)];
  return s.slice(0,17);
}

function randomInvoiceNumber(){
  const d = new Date();
  const y = d.getFullYear();
  const stamp = String(Date.now()).slice(-6);
  return `UAT-CONF-${y}-${stamp}-${randInt(100,999)}`;
}
