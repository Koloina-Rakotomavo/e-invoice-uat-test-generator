function renderChecks(){
 const lines=readLines(), msgs=[];
 if(!uatReady()) msgs.push("• ★ Données UAT à compléter en haut de page avant génération.");
 if(val("supplierEndpoint").includes("A_REMPLACER") || val("buyerEndpoint").includes("A_REMPLACER")) msgs.push("• ROUTAGE : remplace les EndpointID de démonstration avant génération.");
 if(!val("invoiceId")) msgs.push("• Numéro de facture vide.");
 if(!val("supplierSiren")) msgs.push("• SIREN vendeur vide.");
 if(!val("buyerSiren")) msgs.push("• SIREN acheteur vide.");
 if(!val("buyerEndpoint")) msgs.push("• BT-49 acheteur vide.");
 if(!val("registrationId")) msgs.push("• BT-18 / ABZ : immatriculation vide.");
 if(!val("vinId")) msgs.push("• BT-128 / AKG : châssis / VIN vide.");
 if(!val("buyerReference") && !val("orderReference")) msgs.push("• Référence acheteur et commande toutes deux vides.");
 if(lines.length===0) msgs.push("• Aucune ligne de facture.");
 lines.forEach((l,i)=>{
   if(!l.id) msgs.push(`• Ligne ${i+1} : ID absent.`);
   if(!l.name) msgs.push(`• Ligne ${i+1} : nom article absent.`);
   if(l.qty===0) msgs.push(`• Ligne ${i+1} : quantité = 0.`);
   if(l.price<0) msgs.push(`• Ligne ${i+1} : prix négatif.`);
   if(l.baseQty<=0) msgs.push(`• Ligne ${i+1} : quantité de base invalide.`);
   if(!l.vatCategory) msgs.push(`• Ligne ${i+1} : catégorie TVA absente.`);
   if(l.objectScheme==="AKZ" && l.objectId) msgs.push(`• Ligne ${i+1} : qualifiant VIN volontairement faux (AKZ) ; le nominal utilise AKG.`);
 });
 $("checks").innerHTML = msgs.length ? msgs.join("<br>") : "Aucune anomalie évidente dans les données de saisie.";
}

function addr(street,street2,city,postal,country){
 return `<cac:PostalAddress>
  <cbc:StreetName>${esc(street)}</cbc:StreetName>
  ${street2?`<cbc:AdditionalStreetName>${esc(street2)}</cbc:AdditionalStreetName>`:""}
  <cbc:CityName>${esc(city)}</cbc:CityName>
  <cbc:PostalZone>${esc(postal)}</cbc:PostalZone>
  <cac:Country><cbc:IdentificationCode>${esc(country)}</cbc:IdentificationCode></cac:Country>
</cac:PostalAddress>`;
}

function groupTaxes(lines){
 const m=new Map();
 lines.forEach(l=>{
   const k=l.vatCategory+"|"+l.vatRate;
   if(!m.has(k))m.set(k,{cat:l.vatCategory,rate:l.vatRate,base:0,tax:0});
   const x=m.get(k); x.base+=l.net; x.tax+=l.net*l.vatRate/100;
 });
 return [...m.values()];
}

function buildLineXML(l, idx, scenario, cur){
 let id=l.id, qtyTag=`<cbc:InvoicedQuantity unitCode="${esc(l.unit)}">${l.qty.toFixed(3)}</cbc:InvoicedQuantity>`;
 let priceTag=`<cac:Price><cbc:PriceAmount currencyID="${esc(cur)}">${money(l.price)}</cbc:PriceAmount><cbc:BaseQuantity unitCode="${esc(l.unit)}">${l.baseQty.toFixed(3)}</cbc:BaseQuantity></cac:Price>`;
 let vatCat=l.vatCategory;
 let objectScheme=l.objectScheme, objectId=l.objectId;
 if(idx===0 && scenario==="T017") objectId="";
 if(idx===0 && scenario==="T018") objectScheme="AKZ";
 if(idx===0 && scenario==="T010") id="";
 if(idx===0 && scenario==="T011") qtyTag="";
 if(idx===0 && scenario==="T012") priceTag="";
 if(idx===0 && scenario==="T013") vatCat="";
 let lineNet=l.net;
 if(idx===0 && scenario==="T005") lineNet=l.net-1000;

 const allowance = l.allowance>0 ? `<cac:AllowanceCharge><cbc:ChargeIndicator>false</cbc:ChargeIndicator>${l.allowanceReason?`<cbc:AllowanceChargeReason>${esc(l.allowanceReason)}</cbc:AllowanceChargeReason>`:""}<cbc:Amount currencyID="${esc(cur)}">${money(l.allowance)}</cbc:Amount></cac:AllowanceCharge>`:"";
 const charge = l.charge>0 ? `<cac:AllowanceCharge><cbc:ChargeIndicator>true</cbc:ChargeIndicator>${l.chargeReason?`<cbc:AllowanceChargeReason>${esc(l.chargeReason)}</cbc:AllowanceChargeReason>`:""}<cbc:Amount currencyID="${esc(cur)}">${money(l.charge)}</cbc:Amount></cac:AllowanceCharge>`:"";
 const seller=l.sellerItem?`<cac:SellersItemIdentification><cbc:ID>${esc(l.sellerItem)}</cbc:ID></cac:SellersItemIdentification>`:"";
 const buyer=l.buyerItem?`<cac:BuyersItemIdentification><cbc:ID>${esc(l.buyerItem)}</cbc:ID></cac:BuyersItemIdentification>`:"";
 const gtin=l.gtin?`<cac:StandardItemIdentification><cbc:ID schemeID="0160">${esc(l.gtin)}</cbc:ID></cac:StandardItemIdentification>`:"";
 const origin=l.origin?`<cac:OriginCountry><cbc:IdentificationCode>${esc(l.origin)}</cbc:IdentificationCode></cac:OriginCountry>`:"";
 const order=l.orderLine?`<cac:OrderLineReference><cbc:LineID>${esc(l.orderLine)}</cbc:LineID></cac:OrderLineReference>`:"";
 const objectRef=objectId?`<cac:DocumentReference><cbc:ID schemeID="${esc(objectScheme)}">${esc(objectId)}</cbc:ID><cbc:DocumentTypeCode>130</cbc:DocumentTypeCode></cac:DocumentReference>`:"";
 const taxcat=vatCat?`<cac:ClassifiedTaxCategory><cbc:ID>${esc(vatCat)}</cbc:ID><cbc:Percent>${money(l.vatRate)}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:ClassifiedTaxCategory>`:"";
 return `<cac:InvoiceLine>
  ${id?`<cbc:ID>${esc(id)}</cbc:ID>`:""}
  ${qtyTag}
  <cbc:LineExtensionAmount currencyID="${esc(cur)}">${money(lineNet)}</cbc:LineExtensionAmount>
  ${order}
  ${objectRef}
  ${allowance}
  ${charge}
  <cac:Item>
    <cbc:Description>${esc(l.description)}</cbc:Description>
    <cbc:Name>${esc(l.name)}</cbc:Name>
    ${seller}
    ${buyer}
    ${gtin}
    ${origin}
    ${taxcat}
  </cac:Item>
  ${priceTag}
</cac:InvoiceLine>`;
}