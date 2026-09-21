function renderCurrent(){
 if(!current)return;
 $("xmlPreview").value=current.xml;
 $("testCard").innerHTML=`<span class="tag">${current.code}</span><br><b>${current.label}</b><br>Attendu : ${current.expected}<br>Champ : ${current.field}<br>Mutation : ${current.mutation}<br>Fichier : ${current.filename}`;
}
function renderTable(){
 const b=$("testsBody"); b.innerHTML="";
 sessionTests.forEach(t=>{
   const tr=document.createElement("tr");
   [t.code,t.label,t.filename,t.expected,t.field,t.mutation].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td)});
   const td=document.createElement("td"),bt=document.createElement("button"); bt.className="secondary";bt.textContent="Télécharger";bt.onclick=()=>download(t.xml,t.filename,"application/xml");td.appendChild(bt);tr.appendChild(td);b.appendChild(tr);
 });
}
function download(content,name,type){const blob=new Blob([content],{type}),u=URL.createObjectURL(blob),a=document.createElement("a");a.href=u;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function csvEsc(v){return `"${String(v??"").replaceAll('"','""')}"`;}
function csvFor(arr){const h=["ID","Scénario","Facture_XML","Résultat_attendu","Champ_testé","Mutation","Résultat_obtenu","PASS_FAIL","Message_erreur"];return [h,...arr.map(t=>[t.code,t.label,t.filename,t.expected,t.field,t.mutation,"","",""])].map(r=>r.map(csvEsc).join(";")).join("\n");}

$("generateBtn").onclick=()=>{try{
  if(!ensureUatBeforeGenerate()) return;
  current=generate(val("scenario"));
  upsert(current);renderCurrent();
  setStatus("Test généré avec ta base UAT et les données propres au scénario.","ok");
}catch(e){setStatus(e.message,"err")}};

$("allBtn").onclick=()=>{try{
  if(!ensureUatBeforeGenerate()) return;
  sessionTests=[];
  for(const code of Object.keys(META)){
    prefillScenario(code);
    sessionTests.push(generate(code));
  }
  current=sessionTests[0];
  renderTable();renderCurrent();
  prefillScenario("T000");
  setStatus("Tous les scénarios ont été préparés avec des numéros, références et montants différents.","ok");
}catch(e){setStatus(e.message,"err")}};

["uatSupplierSiren","uatSupplierEndpoint","uatBuyerSiren","uatBuyerEndpoint"].forEach(id=>{
  $(id).addEventListener("input",()=>{
    renderCriticalCheck();
    // garder le formulaire synchronisé avec la base UAT
    if(id==="uatSupplierSiren") $("supplierSiren").value=val(id);
    if(id==="uatSupplierEndpoint") $("supplierEndpoint").value=val(id);
    if(id==="uatBuyerSiren") $("buyerSiren").value=val(id);
    if(id==="uatBuyerEndpoint") $("buyerEndpoint").value=val(id);
    recalc();
  });
});


$("vinId").addEventListener("input",()=>{
  const first = document.querySelector(".line-card");
  if(first){
    const vin = first.querySelector('[data-f="objectId"]');
    const scheme = first.querySelector('[data-f="objectScheme"]');
    if(vin) vin.value = val("vinId");
    if(scheme) scheme.value = "AKG";
  }
  recalc();
});

$("scenarioTop").addEventListener("change",()=>prefillScenario(val("scenarioTop")));
$("prefillBtn").addEventListener("click",()=>prefillScenario(val("scenarioTop")));


$("randomConformBtn").addEventListener("click",()=>{
  if(!ensureUatBeforeGenerate()) return;
  randomizeConformForm();
  current = {
    code:"T000",
    ...META.T000,
    xml:buildXML("T000"),
    filename:`T000_${val("invoiceId")}.xml`
  };
  $("xmlPreview").value=current.xml;
  renderCurrent();
});

$("batchConformBtn").addEventListener("click",()=>{
  try{
    if(!ensureUatBeforeGenerate()) return;
    const count = Number(val("conformCount")) || 1;
    const variants = [];
    for(let i=1;i<=count;i++){
      variants.push(makeConformVariant(i));
    }
    // Garder les autres tests de session et remplacer uniquement les anciens T000-Cxxx.
    sessionTests = sessionTests.filter(t=>!String(t.code).startsWith("T000-C"));
    sessionTests.push(...variants);
    sessionTests.sort((a,b)=>String(a.code).localeCompare(String(b.code)));
    current = variants[variants.length-1];
    renderTable();
    renderCurrent();
    $("xmlPreview").value=current.xml;
    setStatus(`${count} factures conformes aléatoires prêtes dans le cahier de tests.`, "ok");
  }catch(e){
    setStatus(e.message,"err");
  }
});

$("downloadXmlBtn").onclick=()=>current?download(current.xml,current.filename,"application/xml"):setStatus("Génère d'abord un test.","err");
$("downloadCsvBtn").onclick=()=>current?download("\uFEFF"+csvFor([current]),current.code+"_cas_de_test.csv","text/csv;charset=utf-8"):setStatus("Génère d'abord un test.","err");
$("downloadAllCsvBtn").onclick=()=>sessionTests.length?download("\uFEFF"+csvFor(sessionTests),"cahier_de_tests_facturation_electronique.csv","text/csv;charset=utf-8"):setStatus("Prépare des tests d'abord.","err");

recalc();
renderCriticalCheck();
prefillScenario("T000");
current=null;
sessionTests=[];
$("xmlPreview").value="";
renderTable();