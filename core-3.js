function lineTemplate(data={}){
  const idx = ++lineCounter;
  const defaults = {
    id:String(idx).padStart(6,"0"),
    orderLine:String(idx).padStart(6,"0"),
    sellerItem: idx===1 ? "VOL-XC60-001" : "ACC-PACK-001",
    buyerItem: idx===1 ? "CLI-XC60-2026" : "CLI-ACC-001",
    name: idx===1 ? "XC60 Ultra T6 AWD" : "Pack accessoires véhicule",
    description: idx===1 ? "XC60 Ultra T6 AWD Hybride Rechargeable" : "Pack accessoires et équipements",
    qty:"1", unit:"H87", price: idx===1 ? "62920.34" : "1200.00", baseQty:"1",
    allowance:"0", allowanceReason:"", charge:"0", chargeReason:"",
    vatCategory:"S", vatRate:"20", origin:"SE", gtin:"", objectScheme:"AKG", objectId: idx===1 ? "YV1UZH5VCN1234567" : ""
  };
  const d={...defaults,...data};
  const div=document.createElement("div"); div.className="line-card"; div.dataset.line=idx;
  div.innerHTML=`
    <div class="line-head"><span class="line-title">Ligne ${idx}</span><button type="button" class="danger removeLine">Supprimer</button></div>
    <div class="subgrid3">
      <div><label>ID ligne (BT-126)</label><input data-f="id" value="${d.id}"></div>
      <div><label>Réf. ligne commande</label><input data-f="orderLine" value="${d.orderLine}"></div>
      <div><label>Réf. article vendeur (BT-155)</label><input data-f="sellerItem" value="${d.sellerItem}"></div>
      <div><label>Réf. article acheteur (BT-156)</label><input data-f="buyerItem" value="${d.buyerItem}"></div>
      <div><label>Nom article (BT-153)</label><input data-f="name" value="${d.name}"></div>
      <div><label>Description (BT-154)</label><input data-f="description" value="${d.description}"></div>
      <div><label>Quantité facturée (BT-129)</label><input data-f="qty" type="number" step="0.001" value="${d.qty}"></div>
      <div><label>Unité (BT-130)</label>
        <select data-f="unit">
          <option value="H87"${d.unit==="H87"?" selected":""}>H87 - pièce</option>
          <option value="C62"${d.unit==="C62"?" selected":""}>C62 - unité</option>
          <option value="HUR"${d.unit==="HUR"?" selected":""}>HUR - heure</option>
          <option value="DAY"${d.unit==="DAY"?" selected":""}>DAY - jour</option>
          <option value="KGM"${d.unit==="KGM"?" selected":""}>KGM - kg</option>
          <option value="LTR"${d.unit==="LTR"?" selected":""}>LTR - litre</option>
        </select>
      </div>
      <div><label>Prix unitaire net (BT-146)</label><input data-f="price" type="number" step="0.01" value="${d.price}"></div>
      <div><label>Quantité de base prix (BT-149)</label><input data-f="baseQty" type="number" step="0.001" value="${d.baseQty}"></div>
      <div><label>Remise ligne (BT-136)</label><input data-f="allowance" type="number" step="0.01" value="${d.allowance}"></div>
      <div><label>Motif remise</label><input data-f="allowanceReason" value="${d.allowanceReason}"></div>
      <div><label>Charge ligne (BT-141)</label><input data-f="charge" type="number" step="0.01" value="${d.charge}"></div>
      <div><label>Motif charge</label><input data-f="chargeReason" value="${d.chargeReason}"></div>
      <div><label>Catégorie TVA (BT-151)</label>
        <select data-f="vatCategory"><option value="S"${d.vatCategory==="S"?" selected":""}>S - standard</option><option value="Z">Z - taux zéro</option><option value="E">E - exonéré</option></select>
      </div>
      <div><label>Taux TVA (BT-152)</label><input data-f="vatRate" type="number" step="0.01" value="${d.vatRate}"></div>
      <div><label>Pays origine</label><input data-f="origin" value="${d.origin}"></div>
      <div><label>GTIN / identifiant standard</label><input data-f="gtin" value="${d.gtin}"></div>
      <div>
        <label>BT-128-1 - Qualifiant VIN</label>
        <input data-f="objectScheme" value="AKG" readonly>
      </div>
      <div><label>BT-128 / AKG - Châssis / VIN</label><input data-f="objectId" value="${d.objectId}"></div>
      <div><label>Montant net ligne (calculé)</label><input data-f="net" readonly></div>
    </div>`;
  div.querySelector(".removeLine").addEventListener("click",()=>{ div.remove(); recalc(); });
  div.querySelectorAll("input,select").forEach(x=>x.addEventListener("input",()=>{
    if(div === document.querySelector(".line-card")){
      const vin = div.querySelector('[data-f="objectId"]');
      if(vin && $("vinId")) $("vinId").value = vin.value;
    }
    recalc();
  }));
  $("lines").appendChild(div);
  recalc();
}

lineTemplate();
lineTemplate();

$("addLineBtn").addEventListener("click",()=>lineTemplate());

function readLines(){
 return [...document.querySelectorAll(".line-card")].map(card=>{
   const g=f=>card.querySelector(`[data-f="${f}"]`);
   const qty=Number(g("qty").value||0), price=Number(g("price").value||0), baseQty=Number(g("baseQty").value||1);
   const allowance=Number(g("allowance").value||0), charge=Number(g("charge").value||0);
   const gross=(baseQty===0?0:(qty/baseQty)*price), net=gross-allowance+charge;
   return {
    id:g("id").value.trim(), orderLine:g("orderLine").value.trim(), sellerItem:g("sellerItem").value.trim(),
    buyerItem:g("buyerItem").value.trim(), name:g("name").value.trim(), description:g("description").value.trim(),
    qty, unit:g("unit").value, price, baseQty, allowance, allowanceReason:g("allowanceReason").value.trim(),
    charge, chargeReason:g("chargeReason").value.trim(), vatCategory:g("vatCategory").value,
    vatRate:Number(g("vatRate").value||0), origin:g("origin").value.trim(), gtin:g("gtin").value.trim(),
    objectScheme:g("objectScheme").value, objectId:g("objectId").value.trim(), gross, net
   };
 });
}

function recalc(){
 const lines=readLines(); let gross=0,allow=0,net=0,vat=0;
 lines.forEach((l,i)=>{gross+=l.gross;allow+=l.allowance;net+=l.net;vat+=l.net*l.vatRate/100;
   const card=document.querySelectorAll(".line-card")[i]; if(card) card.querySelector('[data-f="net"]').value=money(l.net);
 });
 $("sumGross").textContent=money(gross)+" "+val("currency");
 $("sumAllowances").textContent=money(allow)+" "+val("currency");
 $("sumNet").textContent=money(net)+" "+val("currency");
 $("sumVat").textContent=money(vat)+" "+val("currency");
 $("sumTtc").textContent=money(net+vat)+" "+val("currency");
 renderChecks();
}
document.querySelectorAll("input,select").forEach(x=>x.addEventListener("input",recalc));
$("includeDelivery").addEventListener("change",recalc);
