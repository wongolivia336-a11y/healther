import { useMemo, useState } from "react";
import {
  foodCategories, foodRatingMeta, foods, foodSources, mealOptions,
  type FoodCategory, type FoodItem
} from "./content/foodData";
import { Icon } from "./Icon";
import { illustrations } from "./visualAssets";

export function FoodAssistant() {
  const [meal, setMeal] = useState<(typeof mealOptions)[number]>("午餐");
  const [category, setCategory] = useState<"全部" | FoodCategory>("全部");
  const [selected, setSelected] = useState<FoodItem | null>(null);

  const visibleFoods = useMemo(() => foods.filter(item =>
    item.meals.includes(meal) && (category === "全部" || item.category === category)
  ), [meal, category]);

  if (selected) {
    const meta = foodRatingMeta[selected.rating];
    return (
      <section className="feature-page food-page">
        <header className="detail-topbar">
          <button onClick={() => setSelected(null)} aria-label="返回饮食助手"><Icon name="back" /></button>
          <div><small>{selected.category}</small><h1>{selected.name}</h1></div>
        </header>
        <div className={`food-verdict ${selected.rating}`}>
          <span>{meta.label}</span>
          <h2>{selected.portion}</h2>
          <p>{selected.summary}</p>
        </div>
        <div className="feature-section">
          <h2>为什么这样建议</h2>
          <div className="reason-list">
            {selected.reasons.map(reason => (
              <article key={reason.label}><span>{reason.label}</span><p>{reason.text}</p></article>
            ))}
          </div>
        </div>
        <div className="feature-section">
          <h2>可以换成</h2>
          <div className="alternative-list">{selected.alternatives.map(item => <span key={item}>{item}</span>)}</div>
        </div>
        <div className="safety-note">
          <b>这不是个人营养处方</b>
          <p>当前为结合血糖、血脂、肝胆和骨骼健康的保守通用筛选，不根据单次化验自动改变建议。</p>
        </div>
      </section>
    );
  }

  return (
    <section className="feature-page food-page">
      <header className="topbar"><div><small>这顿饭怎么选</small><h1>饮食助手</h1></div></header>
      <section className="feature-hero food-hero">
        <div><span>保守通用筛选</span><h2>不用忌口一切，先把份量和搭配看清楚</h2><p>适合同时关注血糖、血脂、肝胆与骨骼健康。</p></div>
        <img src={illustrations.foodGuide} alt="" />
      </section>

      <div className="feature-section compact">
        <h2>准备哪一餐？</h2>
        <div className="choice-chips meal-chips">
          {mealOptions.map(item => <button key={item} className={meal === item ? "active" : ""} onClick={() => setMeal(item)}>{item}</button>)}
        </div>
      </div>
      <div className="choice-chips category-chips">
        {foodCategories.map(item => <button key={item} className={category === item ? "active" : ""} onClick={() => setCategory(item)}>{item}</button>)}
      </div>

      <div className="food-grid">
        {visibleFoods.map(item => {
          const meta = foodRatingMeta[item.rating];
          return (
            <button className="food-card" key={item.id} onClick={() => setSelected(item)}>
              <span className={`rating-dot ${item.rating}`} />
              <div><h3>{item.name}</h3><p>{item.portion}</p></div>
              <strong className={item.rating}>{meta.label}</strong>
              <Icon name="next" size={16} />
            </button>
          );
        })}
      </div>
      {!visibleFoods.length && <div className="empty-panel">这一分类暂时没有适合当前餐次的条目。</div>}

      <details className="source-panel">
        <summary>内容依据与使用边界</summary>
        <p>首版不计算个人处方和所谓“健康分”，内容按权威患者资料进行保守整理。</p>
        {foodSources.map(source => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.label} ↗</a>)}
      </details>
    </section>
  );
}
