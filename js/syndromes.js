(() => {
const input = document.getElementById('syndrome-search');
const groups = [...document.querySelectorAll('.syndrome-group')];
input.addEventListener('input', () => {
 const query = input.value.trim().toLowerCase(); let count = 0;
 groups.forEach(group => {
  let visible = 0;
  group.querySelectorAll('.syndrome-card').forEach(card => {
   card.hidden = !card.textContent.toLowerCase().includes(query);
   if (!card.hidden) { visible++; count++; }
  });
  group.hidden = !visible;
  const link = document.querySelector('.syndrome-index a[href="#' + group.id + '"]');
  link.hidden = !visible;
 });
 document.getElementById('syndrome-count').textContent = count + (count === 1 ? ' entry' : ' entries') + (query ? ' found' : ' across A–Z');
 document.getElementById('syndrome-empty').hidden = count !== 0;
});
})();