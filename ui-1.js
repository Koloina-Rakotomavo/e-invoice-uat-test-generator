function buildXML(scenario){
 const lines=readLines(); if(!lines.length) throw new Error("Ajoute au moins une ligne.");
 const cur=val("currency");
 const netTotal=lines.reduce((s,l)=>s+l.net,0);
 const taxes=groupTaxes(lines); let vatTotal=taxes.reduce((s,t)=>s+t.tax,0);
 if(scenario==="T006") vatTotal=Math.max(0,vatTotal-1000);

 let inv=val("invoiceId"), buyerSiren=val("buyerSiren"), buyerEp=val("buyerEndpoint"), receiver="0225:"+val("buyerEndpoint");
 let pmt=val("notePMT"),pmd=val("notePMD"),aab=val("noteAAB");
 let registrationId=val("registrationId"), registrationScheme="ABZ", includeObject=true;
 let includeDelivery=$("includeDelivery").checked;
 if(scenario==="T001")inv=""; if(scenario==="T002")buyerSiren=""; if(scenario==="T003")buyerEp="";
 if(scenario==="T004")receiver="0225:"+val("buyerEndpoint")+"_TEST_KO";
 if(scenario==="T007")pmt=""; if(scenario==="T008")pmd=""; if(scenario==="T009")aab="";
 if(scenario==="T014") includeObject=false;
 if(scenario==="T015") registrationScheme="XXX";
 if(scenario==="T016") registrationId="";
 if(scenario==="T019") includeDelivery=false;

 const headerObjectRef = includeObject ? `<cac:AdditionalDocumentReference><cbc:ID schemeID="${esc(registrationScheme)}">${esc(registrationId)}</cbc:ID><cbc:DocumentTypeCode>130</cbc:DocumentTypeCode></cac:AdditionalDocumentReference>` : "";
 const deliveryBlock = includeDelivery ? `<cac:Delivery>
   <cbc:ActualDeliveryDate>${esc(val("deliveryDate"))}</cbc:ActualDeliveryDate>
   <cac:DeliveryLocation>${addr(val("deliveryStreet"),"",val("deliveryCity"),val("deliveryPostal"),val("deliveryCountry"))}</cac:DeliveryLocation>
   <cac:DeliveryParty><cac:PartyName><cbc:Name>${esc(val("deliveryName"))}</cbc:Name></cac:PartyName></cac:DeliveryParty>
 </cac:Delivery>` : "";

 const taxSub=taxes.map(t=>`<cac:TaxSubtotal>
  <cbc:TaxableAmount currencyID="${esc(cur)}">${money(t.base)}</cbc:TaxableAmount>
  <cbc:TaxAmount currencyID="${esc(cur)}">${money(t.tax)}</cbc:TaxAmount>
  <cac:TaxCategory><cbc:ID>${esc(t.cat)}</cbc:ID><cbc:Percent>${money(t.rate)}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
</cac:TaxSubtotal>`).join("\n");

 const lineXml=lines.map((l,i)=>buildLineXML(l,i,scenario,cur)).join("\n");

 return `<?xml version="1.0" encoding="UTF-8"?>
<StandardBusinessDocument xmlns="http://www.unece.org/cefact/namespaces/StandardBusinessDocumentHeader">
<StandardBusinessDocumentHeader>
  <HeaderVersion>1.0</HeaderVersion>
  <Sender><Identifier Authority="iso6523-actorid-upis">0225:${esc(val("supplierEndpoint"))}</Identifier></Sender>
  <Receiver><Identifier Authority="iso6523-actorid-upis">${esc(receiver)}</Identifier></Receiver>
  <DocumentIdentification>
    <Standard>urn:oasis:names:specification:ubl:schema:xsd:Invoice-2</Standard>
    <TypeVersion>2.1</TypeVersion><InstanceIdentifier>${uuid()}</InstanceIdentifier><Type>Invoice</Type>
    <CreationDateAndTime>${new Date().toISOString()}</CreationDateAndTime>
  </DocumentIdentification>
  <BusinessScope>
    <Scope><Type>DOCUMENTID</Type><InstanceIdentifier>urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##${esc(val("customizationId"))}::2.1</InstanceIdentifier><Identifier>busdox-docid-qns</Identifier></Scope>
    <Scope><Type>PROCESSID</Type><InstanceIdentifier>${esc(val("processId"))}</InstanceIdentifier><Identifier>cenbii-procid-ubl</Identifier></Scope>
    <Scope><Type>COUNTRY_C1</Type><InstanceIdentifier>${esc(val("countryC1"))}</InstanceIdentifier></Scope>
  </BusinessScope>
</StandardBusinessDocumentHeader>

<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
 xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
 xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
 <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
 <cbc:CustomizationID>${esc(val("customizationId"))}</cbc:CustomizationID>
 <cbc:ProfileID>${esc(val("profileId"))}</cbc:ProfileID>
 ${inv?`<cbc:ID>${esc(inv)}</cbc:ID>`:""}
 <cbc:IssueDate>${esc(val("issueDate"))}</cbc:IssueDate>
 <cbc:DueDate>${esc(val("dueDate"))}</cbc:DueDate>
 <cbc:InvoiceTypeCode>${esc(val("invoiceType"))}</cbc:InvoiceTypeCode>
 ${pmt?`<cbc:Note>#PMT#${esc(pmt)}</cbc:Note>`:""}
 ${pmd?`<cbc:Note>#PMD#${esc(pmd)}</cbc:Note>`:""}
 ${aab?`<cbc:Note>#AAB#${esc(aab)}</cbc:Note>`:""}
 <cbc:Note>#BAR#B2B</cbc:Note>
 <cbc:DocumentCurrencyCode>${esc(cur)}</cbc:DocumentCurrencyCode>
 ${val("buyerReference")?`<cbc:BuyerReference>${esc(val("buyerReference"))}</cbc:BuyerReference>`:""}
 ${val("orderReference")?`<cac:OrderReference><cbc:ID>${esc(val("orderReference"))}</cbc:ID></cac:OrderReference>`:""}
 ${val("contractReference")?`<cac:ContractDocumentReference><cbc:ID>${esc(val("contractReference"))}</cbc:ID></cac:ContractDocumentReference>`:""}
 ${headerObjectRef}

 <cac:AccountingSupplierParty><cac:Party>
   <cbc:EndpointID schemeID="0225">${esc(val("supplierEndpoint"))}</cbc:EndpointID>
   <cac:PartyName><cbc:Name>${esc(val("supplierName"))}</cbc:Name></cac:PartyName>
   ${addr(val("supplierStreet"),val("supplierStreet2"),val("supplierCity"),val("supplierPostal"),val("supplierCountry"))}
   <cac:PartyTaxScheme><cbc:CompanyID>${esc(val("supplierVat"))}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>
   <cac:PartyLegalEntity><cbc:RegistrationName>${esc(val("supplierName"))}</cbc:RegistrationName><cbc:CompanyID schemeID="0002">${esc(val("supplierSiren"))}</cbc:CompanyID></cac:PartyLegalEntity>
   <cac:Contact><cbc:Name>${esc(val("supplierContact"))}</cbc:Name><cbc:Telephone>${esc(val("supplierPhone"))}</cbc:Telephone><cbc:ElectronicMail>${esc(val("supplierEmail"))}</cbc:ElectronicMail></cac:Contact>
 </cac:Party></cac:AccountingSupplierParty>

 <cac:AccountingCustomerParty><cac:Party>
   ${buyerEp?`<cbc:EndpointID schemeID="0225">${esc(buyerEp)}</cbc:EndpointID>`:""}
   <cac:PartyName><cbc:Name>${esc(val("buyerName"))}</cbc:Name></cac:PartyName>
   ${addr(val("buyerStreet"),val("buyerStreet2"),val("buyerCity"),val("buyerPostal"),val("buyerCountry"))}
   <cac:PartyTaxScheme><cbc:CompanyID>${esc(val("buyerVat"))}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>
   <cac:PartyLegalEntity><cbc:RegistrationName>${esc(val("buyerName"))}</cbc:RegistrationName>${buyerSiren?`<cbc:CompanyID schemeID="0002">${esc(buyerSiren)}</cbc:CompanyID>`:""}</cac:PartyLegalEntity>
   <cac:Contact><cbc:Name>${esc(val("buyerContact"))}</cbc:Name><cbc:ElectronicMail>${esc(val("buyerEmail"))}</cbc:ElectronicMail></cac:Contact>
 </cac:Party></cac:AccountingCustomerParty>

 ${deliveryBlock}

 <cac:PaymentMeans>
   <cbc:PaymentMeansCode>${esc(val("paymentMeans"))}</cbc:PaymentMeansCode>
   <cbc:PaymentID>${esc(val("paymentReference"))}</cbc:PaymentID>
   <cac:PayeeFinancialAccount><cbc:ID>${esc(val("iban"))}</cbc:ID>${val("bic")?`<cac:FinancialInstitutionBranch><cbc:ID>${esc(val("bic"))}</cbc:ID></cac:FinancialInstitutionBranch>`:""}</cac:PayeeFinancialAccount>
 </cac:PaymentMeans>
 <cac:PaymentTerms><cbc:Note>${esc(val("paymentTerms"))}</cbc:Note></cac:PaymentTerms>

 <cac:TaxTotal><cbc:TaxAmount currencyID="${esc(cur)}">${money(vatTotal)}</cbc:TaxAmount>${taxSub}</cac:TaxTotal>
 <cac:LegalMonetaryTotal>
   <cbc:LineExtensionAmount currencyID="${esc(cur)}">${money(netTotal)}</cbc:LineExtensionAmount>
   <cbc:TaxExclusiveAmount currencyID="${esc(cur)}">${money(netTotal)}</cbc:TaxExclusiveAmount>
   <cbc:TaxInclusiveAmount currencyID="${esc(cur)}">${money(netTotal+taxes.reduce((s,t)=>s+t.tax,0))}</cbc:TaxInclusiveAmount>
   <cbc:PayableAmount currencyID="${esc(cur)}">${money(netTotal+taxes.reduce((s,t)=>s+t.tax,0))}</cbc:PayableAmount>
 </cac:LegalMonetaryTotal>

 ${lineXml}
</Invoice>
</StandardBusinessDocument>`;
}

function fname(code){return code+"_"+META[code].label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_|_$/g,"")+".xml";}

function generate(code){
 const x=buildXML(code), m=META[code]; return {code,...m,xml:x,filename:fname(code)};
}
function upsert(t){ const i=sessionTests.findIndex(x=>x.code===t.code); if(i>=0)sessionTests[i]=t;else sessionTests.push(t); sessionTests.sort((a,b)=>a.code.localeCompare(b.code)); renderTable(); }
