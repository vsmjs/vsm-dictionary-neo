module.exports = { fixedEncodeURIComponent, removeDuplicates, isJSONString };

function fixedEncodeURIComponent(str) {
  // encode also characters: !, ', (, ), and *
  return encodeURIComponent(str).replace(/[!'()*]/g,
    c => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function removeDuplicates(arr) {
  return [...new Set(arr)];
}

function isJSONString(str) {
  try {
    let json = JSON.parse(str);
    return (json && typeof json === 'object');
  } catch (e) {
    return false;
  }
}