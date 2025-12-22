import Link from 'next/link';

export default function TransparencyPage() {
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
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-8">Прозрачность</h1>
          
          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Полная прозрачность</h2>
              <p>
                Мы верим, что доверие строится на открытости. Каждый цент, который вы отправляете, 
                отслеживается и учитывается публично.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Что мы публикуем</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Общая сумма собранных средств в реальном времени</li>
                <li>Количество участников и их географическое распределение</li>
                <li>Результаты каждого голосования</li>
                <li>Отчёты о переводе средств победителям</li>
                <li>Все транзакции на блокчейне (для криптоплатежей)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Блокчейн-верификация</h2>
              <p className="mb-4">
                Все платежи в USDC записываются в блокчейн и могут быть проверены любым желающим.
              </p>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm font-mono text-gray-500">
                  Адрес кошелька проекта:<br/>
                  <span className="text-[#1e3a5f]">0x... (будет опубликован после запуска)</span>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Ежемесячные отчёты</h2>
              <p>
                Каждый месяц мы публикуем детальный отчёт:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Сколько средств собрано</li>
                <li>Какой проект победил в голосовании</li>
                <li>Подтверждение перевода средств</li>
                <li>Обратная связь от получателя</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Нулевые скрытые комиссии</h2>
              <p>
                Мы не берём комиссию с ваших 99 центов. Единственные расходы — это комиссии 
                платёжных систем (Stripe ~3% или газ в блокчейне).
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
          <Link href="/rules" className="footer-link">Правила проекта</Link>
          <span className="text-gray-300">·</span>
          <Link href="/transparency" className="text-[#1e3a5f] font-medium">Прозрачность</Link>
          <span className="text-gray-300">·</span>
          <Link href="/how-it-works" className="footer-link">Как используются средства</Link>
        </div>
      </footer>
    </div>
  );
}
