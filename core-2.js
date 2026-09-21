function randomizeConformForm(){
  $("supplierSiren").value = val("uatSupplierSiren");
  $("supplierEndpoint").value = val("uatSupplierEndpoint");
  $("buyerSiren").value = val("uatBuyerSiren");
  $("buyerEndpoint").value = val("uatBuyerEndpoint");
  const inv = randomInvoiceNumber();
  $("invoiceId").value = inv;
  $("paymentReference").value = inv;
  $("buyerReference").value = `ACH-${randInt(10000,99999)}`;
  $("orderReference").value = `CMD-${randInt(100000,999999)}`;
  $("contractReference").value = `CTR-${randInt(10000,99999)}`;
  $("registrationId").value = randomPlate();
  $("vinId").value = randomVin();
  $("profileId").value = "B1";
  $("includeDelivery").checked = Math.random() < 0.45;
  $("lines").innerHTML = "";
  lineCounter = 0;
  const lineCount = randInt(1,4);
  const vehiclePrice = randMoney(28000,78000);
  lineTemplate({id:"000010",orderLine:"000010",sellerItem:`VEH-${randInt(100000,999999)}`,buyerItem:`CLI-VEH-${randInt(10000,99999)}`,name:randChoice(["Véhicule neuf","Véhicule de flotte","Véhicule hybride","Véhicule utilitaire"]),description:"Véhicule de test UAT conforme",qty:"1",unit:"H87",price:money(vehiclePrice),baseQty:"1",allowance:Math.random()<0.35?money(randMoney(100,1200)):"0",allowanceReason:"Remise commerciale",charge:Math.random()<0.25?money(randMoney(20,250)):"0",chargeReason:"Frais de préparation",vatCategory:"S",vatRate:"20",origin:randChoice(["FR","SE","DE","ES"]),gtin:"",objectScheme:"AKG",objectId:val("vinId")});
  const extras=[["Pack entretien",450,1800],["Accessoires véhicule",120,1500],["Frais de préparation",80,500],["Extension de garantie",300,2200],["Pack sécurité",150,900],["Service de livraison",90,600]];
  for(let i=2;i<=lineCount;i++){
    const e=randChoice(extras),q=randInt(1,3);
    lineTemplate({id:String(i*10).padStart(6,"0"),orderLine:String(i*10).padStart(6,"0"),sellerItem:`ART-${randInt(100000,999999)}`,buyerItem:`CLI-ART-${randInt(10000,99999)}`,name:e[0],description:`${e[0]} - scénario conforme`,qty:String(q),unit:"H87",price:money(randMoney(e[1],e[2])),baseQty:"1",allowance:"0",allowanceReason:"",charge:"0",chargeReason:"",vatCategory:"S",vatRate:"20",origin:"FR",gtin:"",objectScheme:"AKG",objectId:""});
  }
  $("scenario").value="T000";$("scenarioTop").value="T000";recalc();clearTestTargets();
  $("prefillInfo").innerHTML=`<b>T000 — nouvel exemple conforme</b><br>N° facture : <b>${inv}</b>. ${lineCount} ligne(s) générée(s), montants et références modifiés. Les SIREN et adresses de routage UAT n’ont pas été modifiés.`;
  setStatus("Nouvel exemple conforme aléatoire prérempli. Vérifie puis génère le XML.","ok");
}
function makeConformVariant(seq){randomizeConformForm();const xml=buildXML("T000"),inv=val("invoiceId");return{code:`T000-C${String(seq).padStart(3,"0")}`,label:"Facture conforme aléatoire",expected:"ACCEPTÉE",field:"Document complet",mutation:"Aucune — données nominales aléatoires et cohérentes",xml,filename:`T000-C${String(seq).padStart(3,"0")}_${inv}.xml`};}
function uniqueVin(n){const suffix=String(1000000+n).padStart(7,"0");return("VF1UAT26"+suffix+"X").slice(0,17);}
function replaceLinesForScenario(n){
  $("lines").innerHTML="";lineCounter=0;const p1=42000+n*731.27,p2=850+n*47.15;
  lineTemplate({id:"000010",orderLine:"000010",sellerItem:`VEH-UAT-${String(n+1).padStart(3,"0")}`,buyerItem:`CLI-VEH-${String(n+1).padStart(3,"0")}`,name:"Véhicule de test UAT",description:`Véhicule de test électronique - scénario T${String(n).padStart(3,"0")}`,qty:"1",unit:"H87",price:money(p1),baseQty:"1",allowance:n%3===0?"250.00":"0",allowanceReason:n%3===0?"Remise commerciale UAT":"",charge:n%4===0?"75.00":"0",chargeReason:n%4===0?"Frais préparation UAT":"",vatCategory:"S",vatRate:"20",origin:"FR",gtin:"",objectScheme:"AKG",objectId:val("vinId")||uniqueVin(n)});
  lineTemplate({id:"000020",orderLine:"000020",sellerItem:`SERV-UAT-${String(n+1).padStart(3,"0")}`,buyerItem:`CLI-SERV-${String(n+1).padStart(3,"0")}`,name:"Prestation complémentaire UAT",description:"Préparation / accessoires / service associé au véhicule",qty:"1",unit:"H87",price:money(p2),baseQty:"1",allowance:"0",allowanceReason:"",charge:"0",chargeReason:"",vatCategory:"S",vatRate:"20",origin:"FR",gtin:"",objectScheme:"AKG",objectId:""});
}
function prefillScenario(code){
  $("scenario").value=code;$("scenarioTop").value=code;const n=scenarioIndex(code);const date=val("issueDate")||new Date().toISOString().slice(0,10);const compactDate=date.replaceAll("-","");
  $("supplierSiren").value=val("uatSupplierSiren");$("supplierEndpoint").value=val("uatSupplierEndpoint");$("buyerSiren").value=val("uatBuyerSiren");$("buyerEndpoint").value=val("uatBuyerEndpoint");
  const invoiceNo=`UAT-${code}-${compactDate}-${String(1001+n).padStart(4,"0")}`;
  $("invoiceId").value=invoiceNo;$("paymentReference").value=invoiceNo;$("buyerReference").value=`ACH-UAT-${code}-${300+n}`;$("orderReference").value=`CMD-UAT-${code}-${500+n}`;$("contractReference").value=`CTR-UAT-${202600+n}`;$("registrationId").value=`AB-${String(100+n).padStart(3,"0")}-UT`;$("vinId").value=uniqueVin(n);$("includeDelivery").checked=false;
  replaceLinesForScenario(n);recalc();highlightTarget(code);const m=META[code];
  $("prefillInfo").innerHTML=`<b>${code} — ${m.label}</b><br>Le formulaire a été prérempli avec des données propres à ce scénario. Le champ testé est surligné en bleu. Les champs <span class="star">★</span> restent à remplacer/valider avec tes données UAT réelles.`;
  $("testCard").innerHTML=`<span class="tag">${code}</span><br><b>${m.label}</b><br>Attendu : ${m.expected}<br>Champ : ${m.field}<br>Mutation appliquée au XML : ${m.mutation}`;
  renderCriticalCheck();setStatus(`Scénario ${code} prérempli. Vérifie les données UAT marquées ★ avant génération.`,"");
}
function ensureUatBeforeGenerate(){renderCriticalCheck();if(!uatReady()){setStatus("Renseigne d’abord les 4 données UAT en haut de page, surtout les 2 adresses de routage.","err");window.scrollTo({top:0,behavior:"smooth"});return false;}return true;}
function setStatus(msg,type=""){$("status").textContent=msg;$("status").className="status"+(type?" "+type:"");}
function defaultDates(){const d=new Date(),due=new Date(d);due.setDate(due.getDate()+30);const iso=x=>x.toISOString().slice(0,10);$("issueDate").value=iso(d);$("deliveryDate").value=iso(d);$("dueDate").value=iso(due);}defaultDates();