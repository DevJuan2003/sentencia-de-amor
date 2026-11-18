document.addEventListener("DOMContentLoaded", () => {
  // 1. Barra de progreso de lectura
  window.addEventListener("scroll", () => {
    const winScroll = document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    const progressBar = document.getElementById("progress");
    if (progressBar) progressBar.style.width = scrolled + "%";
  });

  // 2. Observer para animaciones de aparición (reveal)
  const reveals = document.querySelectorAll(".reveal");
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("active");
        }
      });
    },
    { threshold: 0.05 },
  );
  reveals.forEach((el) => observer.observe(el));

  // Variables globales de firma y elementos
  const canvas = document.getElementById("signPad");
  const acceptCheckbox = document.getElementById("accept");
  const signBtn = document.getElementById("signBtn");
  const clearSignBtn = document.getElementById("clearSign");
  const stamp = document.getElementById("stamp");
  const stampDate = document.getElementById("stampDate");
  const downloadPdfBtn = document.getElementById("downloadPdfBtn");

  // 3. Canvas de Firma Digital
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let drawing = false;
    let hasSigned = false;

    function resizeCanvas() {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width > 0 ? rect.width : canvas.parentElement.clientWidth;
      const height = rect.height > 0 ? rect.height : 130;

      if (canvas.width !== width || canvas.height !== height) {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = canvas.width;
        tempCanvas.height = canvas.height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(canvas, 0, 0);

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(tempCanvas, 0, 0);
      }
    }

    setTimeout(resizeCanvas, 50);
    setTimeout(resizeCanvas, 300);
    window.addEventListener("resize", resizeCanvas);

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    }

    function startDraw(e) {
      drawing = true;
      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
      if (e.cancelable) e.preventDefault();
    }

    function draw(e) {
      if (!drawing) return;
      const pos = getPos(e);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = "#4a2c3a";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.stroke();
      hasSigned = true;
      checkSignState();
      if (e.cancelable) e.preventDefault();
    }

    function endDraw() {
      drawing = false;
    }

    canvas.addEventListener("mousedown", startDraw);
    canvas.addEventListener("mousemove", draw);
    window.addEventListener("mouseup", endDraw);

    canvas.addEventListener("touchstart", startDraw, { passive: false });
    canvas.addEventListener("touchmove", draw, { passive: false });
    canvas.addEventListener("touchend", endDraw);

    function checkSignState() {
      if (acceptCheckbox && acceptCheckbox.checked && hasSigned) {
        if (signBtn) signBtn.removeAttribute("disabled");
      } else {
        if (signBtn) signBtn.setAttribute("disabled", "true");
      }
    }

    if (acceptCheckbox) {
      acceptCheckbox.addEventListener("change", checkSignState);
    }

    if (clearSignBtn) {
      clearSignBtn.addEventListener("click", () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        hasSigned = false;
        checkSignState();
        if (stamp) stamp.classList.remove("show");
        if (downloadPdfBtn) downloadPdfBtn.classList.add("hidden");
      });
    }

    if (signBtn) {
      signBtn.addEventListener("click", () => {
        if (stampDate) {
          const now = new Date();
          stampDate.textContent =
            now.toLocaleDateString() +
            " " +
            now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        if (stamp) stamp.classList.add("show");
        if (downloadPdfBtn) downloadPdfBtn.classList.remove("hidden");
        alert(
          "¡Sentencia firmada y sellada con éxito! Ya puedes descargar tu documento oficial en PDF 🎀",
        );
      });
    }
  }

  // 4. Lógica de Descarga en PDF (Carga html2pdf bajo demanda de forma segura)
  if (downloadPdfBtn) {
    downloadPdfBtn.addEventListener("click", () => {
      if (typeof html2pdf === "undefined") {
        const script = document.createElement("script");
        script.src =
          "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
        script.onload = executePdfDownload;
        document.head.appendChild(script);
      } else {
        executePdfDownload();
      }
    });
  }

  function executePdfDownload() {
    const element = document.querySelector("article.paper");

    const canvasEl = document.getElementById("signPad");
    let tempImg = null;
    if (canvasEl) {
      const dataUrl = canvasEl.toDataURL("image/png");
      tempImg = document.createElement("img");
      tempImg.src = dataUrl;
      tempImg.style.width = "100%";
      tempImg.style.height = "130px";
      tempImg.style.objectFit = "contain";
      canvasEl.style.display = "none";
      canvasEl.parentNode.appendChild(tempImg);
    }

    const opt = {
      margin: [5, 5, 5, 5],
      filename: "Sentencia_de_Amor_Tribunal.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 1.3,
        useCORS: true,
        letterRendering: true,
        scrollY: 0,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: { mode: ["css", "legacy"] },
    };

    if (signBtn) signBtn.style.display = "none";
    if (clearSignBtn) clearSignBtn.style.display = "none";
    if (downloadPdfBtn) downloadPdfBtn.style.display = "none";

    html2pdf()
      .from(element)
      .set(opt)
      .save()
      .then(() => {
        if (signBtn) signBtn.style.display = "";
        if (clearSignBtn) clearSignBtn.style.display = "";
        if (downloadPdfBtn) downloadPdfBtn.style.display = "";
        if (tempImg) {
          tempImg.remove();
          canvasEl.style.display = "";
        }
      })
      .catch((err) => {
        console.error(err);
        if (signBtn) signBtn.style.display = "";
        if (clearSignBtn) clearSignBtn.style.display = "";
        if (downloadPdfBtn) downloadPdfBtn.style.display = "";
        if (tempImg) {
          tempImg.remove();
          canvasEl.style.display = "";
        }
      });
  }
});
