'use client';

import { useRef } from 'react';

export function HelpGuide() {
  const dialog = useRef<HTMLDialogElement>(null);
  return <>
    <button type="button" onClick={() => dialog.current?.showModal()} aria-label="Ouvrir le guide et les questions fréquentes" className="grid size-11 place-items-center rounded-full border border-border bg-card text-lg font-black">?</button>
    <dialog ref={dialog} aria-labelledby="help-title" className="fixed inset-0 m-auto max-h-[85dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-3xl border border-border bg-card p-6 text-foreground backdrop:bg-black/60">
      <div className="flex items-center justify-between gap-4"><h2 id="help-title" className="text-2xl font-black">Bien démarrer avec Wattwise</h2><button type="button" onClick={() => dialog.current?.close()} className="min-h-11 rounded-xl border border-border px-3">Fermer</button></div>
      <ol className="mt-5 list-decimal space-y-3 pl-5 text-sm leading-6">
        <li><strong>Choisissez votre zone.</strong> Elle correspond au marché électrique de votre logement.</li>
        <li><strong>Sélectionnez un appareil.</strong> Ajustez sa puissance et sa durée : les préréglages sont des estimations. Pour une voiture, renseignez la batterie et les niveaux actuel et cible.</li>
        <li><strong>Réglez vos contraintes.</strong> Début autorisé, fin souhaitée, silence et puissance du logement. Les horaires suivent le fuseau de votre appareil. La limite de puissance compare un seul appareil au logement, sans mesurer les autres consommations.</li>
        <li><strong>Choisissez votre priorité.</strong> Économique minimise le prix, écologique le carbone, équilibré combine les deux. Le créneau recommandé couvre le cycle complet ; aucune mise en marche automatique n’est effectuée.</li>
      </ol>
      <h3 className="mt-6 text-lg font-black">Comprendre mes estimations</h3>
      <p className="mt-2 text-sm leading-6">Le coût utilise le prix de gros, sans taxes, réseau ni abonnement. Avec un contrat à prix fixe, décaler votre consommation ne réduit pas forcément votre facture. L’économie affichée compare le créneau à la moyenne des prix de gros affichés.</p>
      <p className="mt-2 text-sm leading-6">Un prix publié vient du marché ; une prévision modélisée peut évoluer. Les gCO₂e/kWh représentent les grammes de gaz à effet de serre, exprimés en équivalent CO₂, par kilowattheure. Plus le chiffre est bas, plus l’électricité est bas carbone. Renouvelable et bas carbone ne sont pas synonymes : le nucléaire est bas carbone mais non renouvelable.</p>
      <h3 className="mt-6 text-lg font-black">Questions fréquentes</h3>
      {[
        ['Comment recevoir les alertes ?', 'Activez la surveillance et autorisez les notifications dans votre navigateur. En cas de refus, modifiez les permissions du site dans le navigateur. Les seuils sont vérifiés au chargement et à chaque actualisation.'],
        ['Les alertes fonctionnent-elles application fermée ?', 'Non. Il n’y a pas de surveillance permanente ni de notification push depuis un serveur. Gardez l’application ouverte et actualisez-la ; une notification n’est pas garantie si elle est fermée ou suspendue.'],
        ['Pourquoi les données sont-elles anciennes ou absentes ?', 'Une panne réseau, un quota ou les droits API peuvent limiter les données. La dernière réponse conservée peut être affichée avec un avertissement. Actualisez et vérifiez la date avant de planifier.'],
        ['Pourquoi la précision n’est-elle pas encore mesurée ?', 'Il faut conserver une prévision puis revenir lorsque le prix correspondant est publié. L’historique de prévisions et vos préférences restent sur cet appareil. Effacer les données du navigateur les supprime.'],
        ['La recharge atteindra-t-elle exactement la cible ?', 'C’est une estimation avec un rendement de 90 % et une puissance moyenne constante. Le véhicule, la température et la fin de charge peuvent modifier la durée. Une cible nécessitant plus de 12 h est signalée et aucun créneau complet n’est annoncé.'],
      ].map(([title, body]) => <details key={title} className="mt-3 rounded-xl border border-border p-3"><summary className="cursor-pointer font-bold">{title}</summary><p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p></details>)}
    </dialog>
  </>;
}
