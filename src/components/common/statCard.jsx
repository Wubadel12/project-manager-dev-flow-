function StatCard({title,value,icon}){

    return(
        <article className="stat-card">
            <div className="stat-card-copy">
                <p className="stat-card-title">{title}</p>
                <h2 className="stat-card-value">{value}</h2>
            </div>

            <span className="stat-card-icon" aria-hidden="true">{icon}</span>
        </article>
    )
}
export default StatCard
