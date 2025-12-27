
const p = products[0];

name.innerText = p.name;
price.innerText = `$${p.price}`;
oldPrice.innerText = `$${p.oldPrice}`;
shortDesc.innerText = p.shortDesc;

desc.innerText = p.description;
add.innerText = p.additional;
rev.innerText = p.reviews;

let q=1;
function qty(v){
  q=Math.max(1,q+v);
  document.getElementById('qty').innerText=q;
}

function tab(id,b){
  document.querySelectorAll('.tab-content').forEach(t=>t.style.display='none');
  document.getElementById(id).style.display='block';
  document.querySelectorAll('.tab-head button').forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
}

// thumbs
p.images.forEach(i=>{
  const d=document.createElement('div');
  d.className='thumb';
  d.innerText='IMG';
  d.onclick=()=>mainImage.innerText=i;
  thumbs.appendChild(d);
});

// related
products.slice(1,5).forEach(r=>{
  related.innerHTML+=`
    <div class="related-card">
      <div class="related-img">IMG</div>
      <h4>${r.name}</h4>
      <span>$${r.price}</span>
    </div>`;
});
