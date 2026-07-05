<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyA-lwQrApcSfdzKOB_f5FQyr4qxSJR0aRM",
    authDomain: "model-tracker-750fa.firebaseapp.com",
    projectId: "model-tracker-750fa",
    storageBucket: "model-tracker-750fa.firebasestorage.app",
    messagingSenderId: "573688861908",
    appId: "1:573688861908:web:3ba2e6a11537cfebb99741",
    measurementId: "G-VNENYYDQ0G"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>