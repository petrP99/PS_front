const grafanaTools = [
    {
        href: 'http://localhost:3000/a/grafana-lokiexplore-app/explore',
        icon: '📝',
        title: 'Logs',
        description: 'Логи сервисов',
    },
    {
        href: 'http://localhost:3000/dashboards',
        icon: '📈',
        title: 'Monitoring',
        description: 'Дашборды метрик',
    },
    {
        href: 'http://localhost:3000/a/grafana-exploretraces-app/explore',
        icon: '➡️️',
        title: 'Trace',
        description: 'Трейсы запросов',
    },
];

const adminTools = [
    {
        href: 'http://localhost:8070/ui/clusters/local/all-topics',
        icon: '🧵',
        title: 'Kafka UI',
        description: 'Топики локального Kafka-кластера',
    },
    {
        href: 'http://localhost:9090/targets',
        icon: '🎯',
        title: 'Prometheus',
        description: 'Состояние targets и сбор метрик',
    },
];

export default function AdminPage() {
    return (
        <div style={{animation: 'fadeIn 0.5s ease-out'}}>
            <div style={{marginBottom: '2rem'}}>
                <h1 style={{fontSize: '1.8rem', fontWeight: 700, marginBottom: '0.5rem'}}>
                    Админ
                </h1>
                <p style={{color: 'rgba(255,255,255,0.5)'}}>
                    Инструменты наблюдаемости и инфраструктуры
                </p>
            </div>

            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '1.25rem',
                    width: '100%',
                    alignItems: 'stretch',
                }}
            >
                <section
                    className="glass"
                    style={{
                        padding: '2rem',
                        border: '1px solid rgba(129,140,248,0.22)',
                        borderRadius: '20px',
                        background: 'linear-gradient(135deg, rgba(129,140,248,0.12), rgba(20,184,166,0.06))',
                        color: '#fff',
                    }}
                >
                    <div style={{fontSize: '2.2rem', marginBottom: '1.25rem'}}>📊</div>
                    <h2 style={{fontSize: '1.2rem', marginBottom: '0.6rem'}}>Grafana</h2>
                    <p style={{color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: '1.25rem'}}>
                        Логи, метрики и трассировка в одном месте
                    </p>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                            gap: '0.7rem',
                        }}
                    >
                        {grafanaTools.map(tool => (
                            <a
                                key={tool.href}
                                href={tool.href}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '34px minmax(0, 1fr)',
                                    alignItems: 'center',
                                    gap: '0.75rem',
                                    padding: '0.8rem 0.9rem',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    borderRadius: '12px',
                                    background: 'rgba(255,255,255,0.045)',
                                    color: '#fff',
                                    textDecoration: 'none',
                                }}
                            >
                                <span style={{fontSize: '1.2rem'}}>{tool.icon}</span>
                                <span style={{minWidth: 0}}>
                                    <strong style={{display: 'block', marginBottom: '0.2rem'}}>
                                        {tool.title}
                                    </strong>
                                    <span style={{color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem'}}>
                                        {tool.description}
                                    </span>
                                </span>
                            </a>
                        ))}
                    </div>
                </section>

                {adminTools.map(tool => (
                    <a
                        key={tool.href}
                        href={tool.href}
                        target="_blank"
                        rel="noreferrer"
                        className="glass"
                        style={{
                            display: 'block',
                            padding: '2rem',
                            border: '1px solid rgba(129,140,248,0.22)',
                            borderRadius: '20px',
                            background: 'rgba(255,255,255,0.035)',
                            color: '#fff',
                            textDecoration: 'none',
                        }}
                    >
                        <div style={{fontSize: '2.2rem', marginBottom: '1.25rem'}}>{tool.icon}</div>
                        <h2 style={{fontSize: '1.2rem', marginBottom: '0.6rem'}}>{tool.title}</h2>
                        <p style={{color: 'rgba(255,255,255,0.5)', lineHeight: 1.5}}>
                            {tool.description}
                        </p>
                    </a>
                ))}
            </div>
        </div>
    );
}
