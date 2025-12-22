import Link from 'next/link';

export default function RulesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="py-6 px-4 border-b border-gray-100">
        <div className="max-w-3xl mx-auto">
          <Link href="/" className="text-2xl font-bold text-[#1e3a5f]">
            99 центов
          </Link>
        </div>
      </header>

      <main className="flex-1 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-8">Правила проекта</h1>
          
          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Что это такое?</h2>
              <p>
                99 центов — это глобальная платформа, где любой человек может добровольно 
                перевести $0.99 и получить только внутреннее чувство причастности.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Философия</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Это не благотворительность в традиционном понимании</li>
                <li>Это не подписка и не инвестиция</li>
                <li>Это не коммерческий продукт</li>
                <li>Главное: честность, прозрачность, минимальное действие</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Как это работает</h2>
              <ol className="list-decimal pl-6 space-y-2">
                <li>Вы отправляете ровно 99 центов — не больше, не меньше</li>
                <li>Вы ничего не получаете взамен — никаких наград, бонусов, NFT</li>
                <li>Ваша точка появляется на карте участников</li>
                <li>Вы получаете право голосовать за проекты (1 голос в сутки)</li>
                <li>Собранные средства направляются на проект-победитель</li>
              </ol>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Голосование</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Голосовать могут только те, кто отправил 99 центов</li>
                <li>Один человек = один голос в сутки</li>
                <li>Голосование проходит еженедельно/ежемесячно</li>
                <li>Проект с наибольшим количеством голосов получает собранные средства</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Анонимность</h2>
              <p>
                Мы не собираем персональные данные. Ваш платёж анонимен. 
                На карте отображается только приблизительное местоположение по IP-адресу.
              </p>
            </section>
          </div>

          <div className="mt-12">
            <Link href="/" className="text-[#1e3a5f] hover:underline">
              ← Вернуться на главную
            </Link>
          </div>
        </div>
      </main>

      <footer className="py-8 border-t border-gray-100">
        <div className="flex justify-center gap-6 flex-wrap">
          <Link href="/rules" className="text-[#1e3a5f] font-medium">Правила проекта</Link>
          <span className="text-gray-300">·</span>
          <Link href="/transparency" className="footer-link">Прозрачность</Link>
          <span className="text-gray-300">·</span>
          <Link href="/how-it-works" className="footer-link">Как используются средства</Link>
        </div>
      </footer>
    </div>
  );
}
