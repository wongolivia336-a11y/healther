import { useMemo, useState } from "react";
import {
  confidenceMeta, learnArticles, learnTopics,
  type LearnArticle, type LearnTopic
} from "./content/learnData";
import { Icon } from "./Icon";
import { illustrations } from "./visualAssets";

export function LearnCenter() {
  const [topic, setTopic] = useState<"全部" | LearnTopic>("全部");
  const [selected, setSelected] = useState<LearnArticle | null>(null);
  const visibleArticles = useMemo(() =>
    learnArticles.filter(article => topic === "全部" || article.topic === topic),
  [topic]);

  if (selected) {
    return (
      <section className="feature-page learn-page">
        <header className="detail-topbar">
          <button onClick={() => setSelected(null)} aria-label="返回安心科普"><Icon name="back" /></button>
          <div><small>{selected.topic}</small><h1>安心科普</h1></div>
        </header>
        <article className="article-detail">
          <div className={`confidence level-${selected.source.level}`}>{confidenceMeta[selected.source.level]}</div>
          <h2>{selected.title}</h2>
          <div className="takeaway"><span>一句话结论</span><p>{selected.takeaway}</p></div>
          <section><h3>大白话解释</h3>{selected.explanation.map((paragraph, index) => <p key={index}>{paragraph}</p>)}</section>
          <section className="what-now"><h3>这和现在有什么关系</h3><p>{selected.now}</p></section>
          <section><h3>下次可以问医生</h3><ul>{selected.doctorQuestions.map(question => <li key={question}>{question}</li>)}</ul></section>
          <footer>
            <span>{selected.source.organization} · 来源核对 {selected.source.reviewedAt}</span>
            <a href={selected.source.url} target="_blank" rel="noreferrer">查看权威原文 <Icon name="external" size={12} /></a>
          </footer>
        </article>
      </section>
    );
  }

  return (
    <section className="feature-page learn-page">
      <header className="topbar"><div><small>少一点搜索，多一点确定</small><h1>安心科普</h1></div></header>
      <section className="feature-hero learn-hero">
        <div><span>权威来源 · 有限推送</span><h2>慢性病需要理解，不需要被严重病例包围</h2><p>每篇都告诉你：现在是否需要改变安排。</p></div>
        <img src={illustrations.learningPath} alt="" />
      </section>
      <div className="choice-chips topic-chips">
        {learnTopics.map(item => <button key={item} className={topic === item ? "active" : ""} onClick={() => setTopic(item)}>{item}</button>)}
      </div>
      <div className="article-list">
        {visibleArticles.map(article => (
          <button key={article.id} className="article-card" onClick={() => setSelected(article)}>
            <div className="article-card-top">
              <span>{article.topic}</span>
              <small className={`level-${article.source.level}`}>{confidenceMeta[article.source.level]}</small>
            </div>
            <h2>{article.title}</h2>
            <p>{article.takeaway}</p>
            <footer><span>{article.source.organization}</span><i>阅读全文 <Icon name="next" size={12} /></i></footer>
          </button>
        ))}
      </div>
      <div className="safety-note calm">
        <b>没有开放搜索，也没有无限资讯流</b>
        <p>只展示经过来源核对的患者科普；首版尚未经过临床专业人员审稿。新研究不会直接触发停药、换药或剂量调整。</p>
      </div>
    </section>
  );
}
