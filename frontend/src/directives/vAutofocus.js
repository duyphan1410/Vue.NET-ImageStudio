export const vAutofocus = {
  mounted: (el) => {
    // Nếu là component bọc ngoài, tìm thẻ input bên trong
    const input = el.tagName === 'INPUT' ? el : el.querySelector('input');
    if (input) {
      input.focus();
      // Mẹo: Bôi đen toàn bộ số để người dùng gõ số mới đè lên luôn
      input.select(); 
    }
  }
}