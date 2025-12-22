import Link from 'next/link';

export default function HowItWorksPage() {
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
          <h1 className="text-3xl font-bold text-[#1e3a5f] mb-8">Как используются средства</h1>
          
          <div className="space-y-6 text-gray-600">
            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Простой процесс</h2>
              <div className="space-y-4">
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center flex-shrink-0">1</div>
                  <div>
                    <h3 className="font-medium text-[#1e3a5f]">Сбор средств</h3>
                    <p>Участники отправляют по 99 центов. Средства накапливаются в течение периода голосования.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center flex-shrink-0">2</div>
                  <div>
                    <h3 className="font-medium text-[#1e3a5f]">Голосование</h3>
                    <p>Участники голосуют за проекты, которые они хотят поддержать. Один человек — один голос в сутки.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center flex-shrink-0">3</div>
                  <div>
                    <h3 className="font-medium text-[#1e3a5f]">Определение победителя</h3>
                    <p>По окончании периода проект с наибольшим количеством голосов становится победителем.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="w-8 h-8 rounded-full bg-[#1e3a5f] text-white flex items-center justify-center flex-shrink-0">4</div>
                  <div>
                    <h3 className="font-medium text-[#1e3a5f]">Перевод средств</h3>
                    <p>Вся собранная сумма переводится на реализацию проекта-победителя.</p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Какие проекты поддерживаем</h2>
              <ul className="list-disc pl-6 space-y-2">
                <li>Обеспечение чистой водой</li>
                <li>Образовательные программы</li>
                <li>Медицинская помощь</li>
                <li>Экологические инициативы</li>
                <li>Помощь местным сообществам</li>
              </ul>
              <p className="mt-4">
                Проекты проходят предварительную проверку перед добавлением в голосование.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Распределение средств</h2>
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <span>На проект-победитель</span>
                  <span className="font-bold text-[#1e3a5f]">100%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div className="bg-[#1e3a5f] h-4 rounded-full" style={{width: '100%'}}></div>
                </div>
                <p className="text-sm mt-4 text-gray-500">
                  Мы не берём комиссию. Все собранные средства идут на выбранный проект.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1e3a5f] mb-3">Отчётность</h2>
              <p>
                После каждого перевода мы публикуем:
              </p>
              <ul className="list-disc pl-6 space-y-2 mt-3">
                <li>Подтверждение транзакции</li>
                <li>Фотоотчёт о реализации проекта</li>
                <li>Обратную связь от получателей</li>
              </ul>
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
          <Link href="/transparency" className="footer-link">Прозрачность</Link>
          <span className="text-gray-300">·</span>
          <Link href="/how-it-works" className="text-[#1e3a5f] font-medium">Как используются средства</Link>
        </div>
      </footer>
    </div>
  );
}
