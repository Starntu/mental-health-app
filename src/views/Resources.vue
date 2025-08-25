<template>
  <div class="resources">
    <h2>Emergency Hotlines</h2>
    <ul class="hotlines">
      <li><a href="tel:988">988 Suicide & Crisis Lifeline (Call)</a></li>
      <li><a href="tel:18002738255">1-800-273-TALK (24/7 Help)</a></li>
      <li><a href="tel:18006624357">1-800-662-HELP (Substance Abuse)</a></li>
      <li><a href="tel:18662314657">1-866-331-9474 (Love Is Respect)</a></li>
      <li><a href="tel:18007997233">1-800-799-SAFE (Domestic Violence)</a></li>
    </ul>

    <h2>Articles on Mental Health</h2>
    <div class="articles">
      <div v-for="(article, index) in articles" :key="index" class="article">
        <h3>{{ article.title }}</h3>
        <p>{{ article.snippet }}</p>
        <a :href="article.link" target="_blank">Read More</a>
      </div>
    </div>
  </div>
</template>

<script setup>
// Array of articles
const articles = [
  {
    title: "Going to a Therapist",
    snippet:
      "What Is Therapy? Therapy is a way to get help with a mental health problem or get extra support if you are going through a tough time.",
    link: "https://kidshealth.org/en/teens/therapist.html",
  },
  {
    title: "What is mental health?",
    snippet:
      "Mental health is about how people think, feel, and behave. Mental health care professionals can help people manage conditions such as depression, anxiety, bipolar disorder, addiction, and other disorders that affect their thoughts, feelings, and behaviors.",
    link: "https://www.medicalnewstoday.com/articles/154543",
  },
  {
    title: "Top 10 Stress Management Techniques for Students",
    snippet:
      "No doubt about it, school is stressful. Academic deadlines, worrying about grades, pressure from parents and teachers, and juggling these challenges with your other responsibilities can leave you feeling frazzled and anxious.",
    link: "https://www.verywellmind.com/top-school-stress-relievers-for-students-3145179",
  },
  {
    title: "How to cope with depression",
    snippet:
      "Try these coping strategies if you're feeling depressed. Stay in touch. Don't withdraw from life. Socialising can improve your mood. Keeping in touch with friends and family means you have someone to talk to when you feel low.  ",
    link: "https://www.nhs.uk/mental-health/self-help/tips-and-support/cope-with-depression/",
  },
  {
    title: "What You Need to Know About Youth Suicide",
    snippet:
      "Suicidal thoughts are common among youth and young adults. In fact, about 12% of young adults ages 18-25 in the U.S. report that they’ve had serious thoughts about suicide in the past year 1, and about 2% report a suicide attempt in the past year.",
    link: "https://www.nami.org/kids-teens-and-young-adults/what-you-need-to-know-about-youth-suicide/",
  },
];
</script>

<style scoped>
.resources {
  padding: 2rem;
  max-width: 800px;
  margin: 2rem auto;
  color: #ffe5f1;
}

.resources h2 {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 1rem;
  text-align: center;
  background: linear-gradient(90deg, #ff3eb0, #ff8c42);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.hotlines {
  padding: 0;
  margin-bottom: 2rem;
  text-align: center;
}

.hotlines li {
  list-style: none;
  margin-bottom: 10px;
}

.hotlines a {
  color: #ffd700;
  font-weight: bold;
  text-decoration: none;
  transition:
    color 0.3s,
    text-shadow 0.3s;
}

.hotlines a:hover {
  color: #ffb347;
  text-shadow: 0 0 8px #ffec99;
}

.articles {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.article {
  background: #7b3aed;
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 12px 35px rgba(0, 0, 0, 0.3);
  transition:
    transform 0.3s,
    box-shadow 0.3s;
}

.article:hover {
  transform: translateZ(10px) scale(1.02);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4);
}

.article h3 {
  margin: 0 0 0.5rem;
  font-weight: 700;
  color: #ffd700;
}

.article p {
  color: #ffe5f1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  margin-bottom: 0.75rem;
}

.article a {
  display: inline-block;
  color: #ffb347;
  font-weight: 600;
  text-decoration: none;
  transition:
    color 0.3s,
    text-shadow 0.3s;
}

.article a:hover {
  color: #ffd700;
  text-shadow: 0 0 8px #ffec99;
}
</style>
