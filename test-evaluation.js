var val = "Memiliki lebih banyak uang:39|Proses aplikasinya lebih mudah / persyaratannya lebih sedikit untuk mendapatkannya:15|Jika saya tidak harus pergi ke cabang institusi yang menawarkan produk untuk mendapatkannya:87|Jika tidak memerlukan paket data / koneksi internet:9|Jika tidak memerlukan [misalnya ponsel] alat mahal:73|Jika kartu diterima sebagai metode pembayaran:3|Jika saya dapat menerima kiriman uang melalui lembaga yang menyediakan produk:65|Jika dengan menerima kiriman uang dapat mendukung kelayakan kredit:44|Jika saya bisa mendapatkannya dari lembaga yang bukan bank:77";

/* evaluateRule function returns true or false */
function evaluateRule(context) {
  var answer = context.MatchedValue
  var answers = context.MatchedValue.split('|');
  var answer_count = answers.length;
  var isValid = (answer_count == 12);

  if (isValid) {
    for (var i = 0; i < answers.length; i++) {
      var answer_val = answers[i].split(':')[1];
      var nval = parseInt(answer_val);
      if (isNaN(nval)) {
        isValid = false;
      }
      else if (nval != 99 && nval != 88) {
        if (nval < 1 || nval > 5) {
          isValid = false;
        }
      }
    }
  }

  if (isValid) {
    return false;
  }
  else {
    return true;
  }
}


evaluateRule({
  MatchedValue: val
})